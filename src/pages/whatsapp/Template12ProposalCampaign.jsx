import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from '../../partials/Sidebar'
import Header from '../../partials/Header'
import whatsappService, { extractCampaignSendResult } from '../../services/whatsappService'
import { toast } from 'react-hot-toast'

const TEMPLATE_ID = 12
const STORAGE_KEY = 'whatsapp-template-12-proposal-campaign'
const DEFAULT_MIN_JITTER_SECONDS = 60
const DEFAULT_MAX_JITTER_SECONDS = 120
const DEFAULT_ATTRIBUTES = {
  attribute1: 'good evening',
  attribute2: 'the proposal which I had sent on {email}',
  attribute3:
    'an official whatsapp for your business, and not just any number. we do this without a setup fee and you only subscribe when you have officially have it',
  attribute4: '',
  attribute5: '',
  attribute6: '',
  attribute7: '',
  attribute8: '',
}

function formatDelay(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes <= 0) return `${remainingSeconds}s`
  return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`
}

async function fetchJson(url, options) {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || `Request failed (${response.status})`)
  }
  return data
}

function randomDelayMs(minSeconds, maxSeconds) {
  const minMs = Math.max(0, Number(minSeconds) || 0) * 1000
  const maxMs = Math.max(minMs, (Number(maxSeconds) || 0) * 1000)
  return Math.floor(minMs + Math.random() * (maxMs - minMs + 1))
}

function renderAttributeTemplate(template, contact) {
  return String(template || '')
    .replaceAll('{email}', contact.email || '')
    .replaceAll('{name}', contact.name || '')
    .replaceAll('{phone}', contact.phone || '')
}

function getInitialTrackerRows(contacts) {
  return contacts.map(contact => ({
    ...contact,
    status: contact.status || 'pending',
    campaignId: contact.campaignId || null,
    sentAt: contact.sentAt || null,
    error: contact.error || null,
    raw: null,
  }))
}

function buildContactDto(contact, attributes) {
  return {
    contactNo: contact.phone,
    contactName: contact.name || 'Recipient',
    attribute1: renderAttributeTemplate(attributes.attribute1, contact),
    attribute2: renderAttributeTemplate(attributes.attribute2, contact),
    attribute3: renderAttributeTemplate(attributes.attribute3, contact),
    attribute4: renderAttributeTemplate(attributes.attribute4, contact),
    attribute5: renderAttributeTemplate(attributes.attribute5, contact),
    attribute6: renderAttributeTemplate(attributes.attribute6, contact),
    attribute7: renderAttributeTemplate(attributes.attribute7, contact),
    attribute8: renderAttributeTemplate(attributes.attribute8, contact),
  }
}

function Template12ProposalCampaign() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [files, setFiles] = useState([])
  const [fileSearch, setFileSearch] = useState('')
  const [selectedFile, setSelectedFile] = useState('')
  const [contacts, setContacts] = useState([])
  const [rows, setRows] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [loadingWorkbook, setLoadingWorkbook] = useState(false)
  const [workbookError, setWorkbookError] = useState('')
  const [running, setRunning] = useState(false)
  const [nextDelayMs, setNextDelayMs] = useState(null)
  const [secondsUntilNext, setSecondsUntilNext] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [sendLimit, setSendLimit] = useState(17)
  const [minJitterSeconds, setMinJitterSeconds] = useState(DEFAULT_MIN_JITTER_SECONDS)
  const [maxJitterSeconds, setMaxJitterSeconds] = useState(DEFAULT_MAX_JITTER_SECONDS)
  const [attributes, setAttributes] = useState(DEFAULT_ATTRIBUTES)
  const [runProgress, setRunProgress] = useState({ attempted: 0, limit: 0 })
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const scheduleNextSendRef = useRef(null)
  const rowsRef = useRef([])
  const selectedFileRef = useRef('')
  const attributesRef = useRef(DEFAULT_ATTRIBUTES)
  const sendLimitRef = useRef(0)
  const attemptedThisRunRef = useRef(0)

  const setTrackedRows = useCallback(nextRowsOrUpdater => {
    const nextRows =
      typeof nextRowsOrUpdater === 'function'
        ? nextRowsOrUpdater(rowsRef.current)
        : nextRowsOrUpdater
    rowsRef.current = nextRows
    setRows(nextRows)
  }, [])

  useEffect(() => {
    selectedFileRef.current = selectedFile
  }, [selectedFile])

  useEffect(() => {
    attributesRef.current = attributes
  }, [attributes])

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  useEffect(() => {
    const loadFiles = async () => {
      setLoadingFiles(true)
      setWorkbookError('')
      try {
        const params = new URLSearchParams()
        if (fileSearch.trim()) params.set('search', fileSearch.trim())
        const data = await fetchJson(
          `/api/whatsapp-agent/proposal-campaign/files?${params.toString()}`
        )
        setFiles(data.files || [])
        if (!selectedFileRef.current && data.files?.[0]?.path) {
          setSelectedFile(data.files[0].path)
        }
      } catch (error) {
        console.error(error)
        setWorkbookError(error.message || 'Failed to search waexcelfiles')
      } finally {
        setLoadingFiles(false)
      }
    }

    const handle = window.setTimeout(loadFiles, 200)
    return () => window.clearTimeout(handle)
  }, [fileSearch])

  useEffect(() => {
    if (!selectedFile) {
      setContacts([])
      setTrackedRows([])
      return
    }

    const loadWorkbook = async () => {
      setLoadingWorkbook(true)
      setWorkbookError('')
      try {
        const params = new URLSearchParams({ file: selectedFile })
        const data = await fetchJson(
          `/api/whatsapp-agent/proposal-campaign/workbook?${params.toString()}`
        )
        const parsedContacts = data.workbook?.contacts || []
        setContacts(parsedContacts)
        setSendLimit(current =>
          Math.max(1, Math.min(Number(current) || 1, parsedContacts.length || 1))
        )

        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
        if (saved?.selectedFile === selectedFile && saved?.attributes) {
          setAttributes({ ...DEFAULT_ATTRIBUTES, ...saved.attributes })
        }
        if (saved?.selectedFile === selectedFile && Number.isFinite(Number(saved?.sendLimit))) {
          setSendLimit(Math.max(1, Math.min(Number(saved.sendLimit), parsedContacts.length || 1)))
        }
        if (
          saved?.selectedFile === selectedFile &&
          Number.isFinite(Number(saved?.minJitterSeconds))
        ) {
          setMinJitterSeconds(Number(saved.minJitterSeconds))
        }
        if (
          saved?.selectedFile === selectedFile &&
          Number.isFinite(Number(saved?.maxJitterSeconds))
        ) {
          setMaxJitterSeconds(Number(saved.maxJitterSeconds))
        }

        setTrackedRows(getInitialTrackerRows(parsedContacts))
      } catch (error) {
        console.error(error)
        setWorkbookError(error.message || 'Failed to load campaign workbook')
      } finally {
        setLoadingWorkbook(false)
      }
    }

    loadWorkbook()
  }, [selectedFile, setTrackedRows])

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        updatedAt: new Date().toISOString(),
        selectedFile,
        sendLimit,
        minJitterSeconds,
        maxJitterSeconds,
        attributes,
        rows,
      })
    )
  }, [attributes, maxJitterSeconds, minJitterSeconds, rows, selectedFile, sendLimit])

  const stats = useMemo(() => {
    const sent = rows.filter(row => row.status === 'sent').length
    const failed = rows.filter(row => row.status === 'failed').length
    const sending = rows.filter(row => row.status === 'sending').length
    const pending = rows.filter(row => row.status === 'pending').length
    const invalid = rows.filter(row => row.status === 'invalid').length
    const checking = rows.filter(row => row.status === 'checking').length
    return { sent, failed, sending, pending, invalid, checking, total: rows.length }
  }, [rows])

  const nextPendingIndex = useCallback(
    currentRows => currentRows.findIndex(row => row.status === 'pending'),
    []
  )

  const updateRow = useCallback(
    (rowId, patch) => {
      setTrackedRows(currentRows =>
        currentRows.map(row => (row.id === rowId ? { ...row, ...patch } : row))
      )
    },
    [setTrackedRows]
  )

  const updateWorkbookStatus = useCallback(async (row, patch) => {
    if (!selectedFileRef.current) return
    await fetchJson('/api/whatsapp-agent/proposal-campaign/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: selectedFileRef.current,
        rowNumber: row.rowNumber,
        status: patch.status,
        campaignId: patch.campaignId,
        sentAt: patch.sentAt,
        error: patch.error,
      }),
    })
  }, [])

  const validateRow = useCallback(
    async row => {
      updateRow(row.id, { status: 'checking', error: null, raw: null })
      updateWorkbookStatus(row, { status: 'checking', error: null }).catch(console.error)

      try {
        const url = 'https://whatsapp-number-validator3.p.rapidapi.com/WhatsappNumberHasItWithToken'
        const payload = { phone_number: String(row.phone).replace(/\D/g, '') }
        const headers = {
          'x-rapidapi-key': 'fb938a938cmshb2c2152129cf1bep1b3fd2jsn62dddc8c5721',
          'x-rapidapi-host': 'whatsapp-number-validator3.p.rapidapi.com',
          'Content-Type': 'application/json',
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload),
        })
        const data = await response.json()

        // Checking common successful properties from WhatsApp validator APIs
        const isValid =
          data?.has_whatsapp === true ||
          data?.exists === true ||
          data?.isValid === true ||
          data?.status === 'valid' ||
          data?.success === true

        if (!isValid) {
          const patch = { status: 'invalid', error: 'Number not on WhatsApp', raw: data }
          updateRow(row.id, patch)
          setLastResult({ ok: false, rowId: row.id, raw: data })
          updateWorkbookStatus(row, patch).catch(console.error)
          return false
        }
        return true
      } catch (error) {
        const patch = {
          status: 'failed',
          error: 'Validation error: ' + error.message,
          raw: error.message,
        }
        updateRow(row.id, patch)
        setLastResult({ ok: false, rowId: row.id, raw: error.message })
        updateWorkbookStatus(row, patch).catch(console.error)
        return false // Skip if validation fails
      }
    },
    [updateRow, updateWorkbookStatus]
  )

  const sendRow = useCallback(
    async row => {
      updateRow(row.id, { status: 'sending', error: null, raw: null })
      attemptedThisRunRef.current += 1
      setRunProgress({ attempted: attemptedThisRunRef.current, limit: sendLimitRef.current })
      updateWorkbookStatus(row, { status: 'sending', error: null }).catch(error => {
        console.error(error)
        toast.error(`Could not update workbook row ${row.rowNumber}: ${error.message}`)
      })

      try {
        const response = await whatsappService.campaigns.sendCampaign(TEMPLATE_ID, [
          buildContactDto(row, attributesRef.current),
        ])
        const { campaignId, raw } = extractCampaignSendResult(response.data)
        const sentAt = new Date().toISOString()
        const patch = {
          status: 'sent',
          campaignId,
          sentAt,
          error: null,
          raw,
        }
        updateRow(row.id, {
          ...patch,
        })
        setLastResult({ ok: true, rowId: row.id, campaignId, raw })
        await updateWorkbookStatus(row, patch).catch(statusError => {
          console.error(statusError)
          toast.error(
            `Sent row ${row.rowNumber}, but workbook status was not updated: ${statusError.message}`
          )
        })
      } catch (error) {
        const data = error.response?.data
        const message =
          data?.message || data?.title || data?.error || error.message || 'Send failed'
        const patch = {
          status: 'failed',
          error: typeof message === 'string' ? message : 'Send failed',
          raw: data ?? error.message,
        }
        updateRow(row.id, patch)
        setLastResult({ ok: false, rowId: row.id, raw: data ?? error.message })
        await updateWorkbookStatus(row, patch).catch(statusError => {
          console.error(statusError)
          toast.error(`Could not update workbook row ${row.rowNumber}: ${statusError.message}`)
        })
      }
    },
    [updateRow, updateWorkbookStatus]
  )

  const scheduleNextSend = useCallback(
    delayMs => {
      clearTimers()
      setNextDelayMs(delayMs)
      setSecondsUntilNext(Math.ceil(delayMs / 1000))

      const targetTime = Date.now() + delayMs
      countdownRef.current = window.setInterval(() => {
        setSecondsUntilNext(Math.max(0, Math.ceil((targetTime - Date.now()) / 1000)))
      }, 1000)

      timerRef.current = window.setTimeout(async () => {
        clearTimers()
        setNextDelayMs(null)
        setSecondsUntilNext(null)

        let sentOneValid = false

        while (!sentOneValid) {
          if (attemptedThisRunRef.current >= sendLimitRef.current) {
            setRunning(false)
            toast.success(`Campaign stopped after ${sendLimitRef.current} sends`)
            return
          }

          const pendingIndex = nextPendingIndex(rowsRef.current)
          const rowToSend = pendingIndex >= 0 ? rowsRef.current[pendingIndex] : null

          if (!rowToSend) {
            setRunning(false)
            toast.success('Template 12 campaign completed')
            return
          }

          const isValid = await validateRow(rowToSend)
          if (isValid) {
            await sendRow(rowToSend)
            sentOneValid = true // Breaks the loop, schedules next delay
          }
          // If invalid, loop continues immediately without delay to check next number
        }

        if (nextPendingIndex(rowsRef.current) === -1) {
          setRunning(false)
          toast.success('Template 12 campaign completed')
        } else if (attemptedThisRunRef.current >= sendLimitRef.current) {
          setRunning(false)
          toast.success(`Campaign stopped after ${sendLimitRef.current} sends`)
        } else {
          scheduleNextSendRef.current?.(randomDelayMs(minJitterSeconds, maxJitterSeconds))
        }
      }, delayMs)
    },
    [clearTimers, maxJitterSeconds, minJitterSeconds, nextPendingIndex, sendRow, validateRow]
  )

  useEffect(() => {
    scheduleNextSendRef.current = scheduleNextSend
  }, [scheduleNextSend])

  const startCampaign = async () => {
    const currentRows = rowsRef.current.length ? rowsRef.current : rows
    if (!currentRows.length) {
      toast.error('No contacts loaded')
      return
    }
    if (running) return
    if (!selectedFile) {
      toast.error('Choose a workbook first')
      return
    }
    if (Number(minJitterSeconds) > Number(maxJitterSeconds)) {
      toast.error('Minimum jitter cannot be greater than maximum jitter')
      return
    }

    const firstPending = currentRows.find(row => row.status === 'pending')
    if (!firstPending) {
      toast('All contacts have already been processed')
      return
    }

    const normalizedLimit = Math.max(1, Math.min(Number(sendLimit) || 1, stats.pending))
    sendLimitRef.current = normalizedLimit
    attemptedThisRunRef.current = 0
    setRunProgress({ attempted: 0, limit: normalizedLimit })
    setRunning(true)

    // Trigger the first validation and send sequence immediately (0ms delay)
    scheduleNextSend(0)
  }

  const pauseCampaign = () => {
    clearTimers()
    setRunning(false)
    setNextDelayMs(null)
    setSecondsUntilNext(null)
    setRunProgress({ attempted: attemptedThisRunRef.current, limit: sendLimitRef.current })
    toast('Campaign paused')
  }

  const resetCampaign = async () => {
    clearTimers()
    setRunning(false)
    setNextDelayMs(null)
    setSecondsUntilNext(null)
    setLastResult(null)
    const resetRows = getInitialTrackerRows(contacts)
    setTrackedRows(resetRows)
    window.localStorage.removeItem(STORAGE_KEY)
    if (selectedFile) {
      await Promise.allSettled(
        resetRows.map(row =>
          updateWorkbookStatus(row, {
            status: 'pending',
            campaignId: '',
            sentAt: '',
            error: '',
          })
        )
      )
    }
  }

  const retryFailed = async () => {
    const failedRows = rowsRef.current.filter(row => row.status === 'failed')
    setTrackedRows(currentRows =>
      currentRows.map(row =>
        row.status === 'failed'
          ? { ...row, status: 'pending', error: null, raw: null, campaignId: null, sentAt: null }
          : row
      )
    )
    await Promise.allSettled(
      failedRows.map(row =>
        updateWorkbookStatus(row, {
          status: 'pending',
          campaignId: '',
          sentAt: '',
          error: '',
        })
      )
    )
  }

  const updateAttribute = (key, value) => {
    setAttributes(current => ({ ...current, [key]: value }))
  }

  const firstRow = rows[0] || {}
  const attributePreview = renderAttributeTemplate(attributes.attribute2, firstRow)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Template 12 proposal campaign
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Search <code>waexcelfiles</code>, choose a workbook, and send template ID{' '}
                  {TEMPLATE_ID} with editable attributes.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={startCampaign}
                  disabled={running || loadingWorkbook || stats.pending === 0 || !selectedFile}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {running ? 'Campaign running' : 'Start campaign'}
                </button>
                <button
                  type="button"
                  onClick={pauseCampaign}
                  disabled={!running}
                  className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={resetCampaign}
                  disabled={running || loadingWorkbook}
                  className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </div>

            {workbookError && (
              <div className="mb-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-200">
                {workbookError}
              </div>
            )}

            <section className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search waexcelfiles
                  </label>
                  <input
                    type="search"
                    value={fileSearch}
                    onChange={event => setFileSearch(event.target.value)}
                    disabled={running}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Search by filename or folder"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Workbook
                  </label>
                  <select
                    value={selectedFile}
                    onChange={event => setSelectedFile(event.target.value)}
                    disabled={running || loadingFiles}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">
                      {loadingFiles ? 'Searching...' : 'Choose an Excel file'}
                    </option>
                    {files.map(file => (
                      <option key={file.path} value={file.path}>
                        {file.path}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Status is written back into the selected Excel file as sends run.
                  </p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8">
              {[
                ['Total', stats.total],
                ['Pending', stats.pending],
                ['Checking', stats.checking],
                ['Sending', stats.sending],
                ['Sent', stats.sent],
                ['Failed', stats.failed],
                ['Invalid', stats.invalid],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5"
                >
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {label}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <section className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Campaign tracker
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Column H supplies WhatsApp number, column I supplies the email merge tag.
                    </p>
                  </div>
                  {stats.failed > 0 && (
                    <button
                      type="button"
                      onClick={retryFailed}
                      disabled={running}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                    >
                      Retry failed
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/60">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                          Row
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                          WhatsApp
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                          Email merge tag
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                          Attribute 2 preview
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {loadingWorkbook ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                            Loading workbook...
                          </td>
                        </tr>
                      ) : rows.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                            Choose an Excel file to load contacts.
                          </td>
                        </tr>
                      ) : (
                        rows.map(row => (
                          <tr key={row.id} className="align-top">
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                              {row.rowNumber}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">{row.name}</td>
                            <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">
                              {row.phone}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {row.email}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              <div className="max-w-xs">
                                {renderAttributeTemplate(attributes.attribute2, row)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                  row.status === 'sent'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : row.status === 'failed'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                      : row.status === 'invalid'
                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                                        : row.status === 'sending' || row.status === 'checking'
                                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {row.status}
                              </span>
                              {row.campaignId != null && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Campaign ID: <code>{String(row.campaignId)}</code>
                                </div>
                              )}
                              {row.error && (
                                <div className="text-xs text-red-600 dark:text-red-300 mt-1">
                                  {row.error}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Send settings</h2>
                  <div className="mt-4 space-y-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500 dark:text-gray-400">Template ID</span>
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">
                        {TEMPLATE_ID}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Total sends for this run
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={Math.max(1, stats.pending)}
                        value={sendLimit}
                        onChange={event => setSendLimit(event.target.value)}
                        disabled={running}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        This run will stop after{' '}
                        {Math.max(1, Math.min(Number(sendLimit) || 1, Math.max(1, stats.pending)))}{' '}
                        send attempts.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                          Min jitter seconds
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={minJitterSeconds}
                          onChange={event => setMinJitterSeconds(event.target.value)}
                          disabled={running}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                          Max jitter seconds
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={maxJitterSeconds}
                          onChange={event => setMaxJitterSeconds(event.target.value)}
                          disabled={running}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500 dark:text-gray-400">Next random stop</span>
                      <span className="text-gray-900 dark:text-white">
                        {nextDelayMs == null ? '-' : formatDelay(nextDelayMs)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500 dark:text-gray-400">Countdown</span>
                      <span className="text-gray-900 dark:text-white">
                        {secondsUntilNext == null ? '-' : formatDelay(secondsUntilNext * 1000)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500 dark:text-gray-400">This run</span>
                      <span className="text-gray-900 dark:text-white">
                        {runProgress.limit ? `${runProgress.attempted}/${runProgress.limit}` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Attributes</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use {'{email}'}, {'{name}'}, or {'{phone}'} to merge row values.
                  </p>
                  <div className="mt-4 space-y-4 text-sm">
                    {Object.entries(attributes).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                          {key}
                        </label>
                        <textarea
                          value={value}
                          onChange={event => updateAttribute(key, event.target.value)}
                          disabled={running}
                          rows={key === 'attribute3' ? 4 : 2}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                        />
                      </div>
                    ))}
                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 p-3">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Attribute 2 preview
                      </div>
                      <div className="text-gray-900 dark:text-white mt-1">
                        {attributePreview || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {lastResult && (
                  <div
                    className={`rounded-3xl border p-6 ${
                      lastResult.ok
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <h2 className="font-semibold text-gray-900 dark:text-white">Last API result</h2>
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Raw response
                      </summary>
                      <pre className="mt-2 p-3 rounded-xl bg-gray-900/90 text-gray-100 overflow-x-auto max-h-56 overflow-y-auto">
                        {JSON.stringify(lastResult.raw, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Template12ProposalCampaign
