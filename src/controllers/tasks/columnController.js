import React, { useMemo, useCallback } from 'react';
import { formatLastUpdated } from './utilsController.js';
import {
  renderUserId,
  renderHandle,
  renderPublicEmail,
  renderHashtags,
  renderTasks,
  renderFollowers,
  renderPosts,
  renderSubscribers,
  renderLastUpdated,
  renderProfileName,
  renderBio,
  renderLastPost,
  renderPrivacy,
  renderBusiness,
  renderVerified,
  renderPublicPhone,
  renderProfileLink,
  renderCategory
} from './columnRenderers.jsx';

/**
 * Column Controller
 * Handles column definitions for data tables
 * Supports dynamic column generation based on Mediafy configs
 * 
 * @param {Object} selectedMediafyConfig - Selected Mediafy configuration
 * @returns {Object} Controller interface with column definitions
 */
export const useColumnController = (selectedMediafyConfig = null) => {
  // Base column definitions
  const userIdColumn = useMemo(
    () => ({
      id: 'userid',
      header: 'User ID',
      sortable: true,
      minWidth: 170,
      accessor: (row) => row.userid || row.instagram_id,
      render: renderUserId
    }),
    []
  );

  const handleColumn = useMemo(
    () => ({
      id: 'login',
      header: 'Handle',
      sortable: true,
      minWidth: 180,
      accessor: (row) => row.login || row.userid,
      render: renderHandle
    }),
    []
  );

  const publicEmailColumn = useMemo(
    () => ({
      id: 'public_email',
      header: 'Public Email',
      sortable: true,
      minWidth: 240,
      accessor: (row) => row.public_email || row.backup_email,
      render: renderPublicEmail
    }),
    []
  );

  const hashtagsColumn = useMemo(
    () => ({
      id: 'hashtag_count',
      header: 'Hashtags',
      sortable: true,
      align: 'right',
      minWidth: 110,
      accessor: (row) => row.hashtag_count,
      render: renderHashtags
    }),
    []
  );

  const tasksColumn = useMemo(
    () => ({
      id: 'task_count',
      header: 'Tasks',
      sortable: true,
      align: 'right',
      minWidth: 110,
      accessor: (row) => row.task_count,
      render: renderTasks
    }),
    []
  );

  const followersColumn = useMemo(
    () => ({
      id: 'followers',
      header: 'Followers',
      sortable: true,
      align: 'right',
      minWidth: 120,
      accessor: (row) => row.followers,
      render: renderFollowers
    }),
    []
  );

  const postsColumn = useMemo(
    () => ({
      id: 'posts',
      header: 'Posts',
      sortable: true,
      align: 'right',
      minWidth: 110,
      accessor: (row) => row.posts,
      render: renderPosts
    }),
    []
  );

  const subscribersColumn = useMemo(
    () => ({
      id: 'subscribers',
      header: 'Subscribers',
      sortable: true,
      align: 'right',
      minWidth: 130,
      accessor: (row) => row.subscribers,
      render: renderSubscribers
    }),
    []
  );

  const lastUpdatedColumn = useMemo(
    () => ({
      id: 'updated_at',
      header: 'Last Updated',
      sortable: true,
      minWidth: 190,
      accessor: (row) => row.updated_at,
      render: renderLastUpdated
    }),
    []
  );

  // Column maps and compositions
  const identityColumnMap = useMemo(
    () => ({
      id: userIdColumn,
      login: handleColumn,
      email: publicEmailColumn
    }),
    [userIdColumn, handleColumn, publicEmailColumn]
  );

  const enterpriseContextColumns = useMemo(
    () => [hashtagsColumn, tasksColumn, lastUpdatedColumn],
    [hashtagsColumn, tasksColumn, lastUpdatedColumn]
  );

  const legacyColumns = useMemo(
    () => [
      userIdColumn,
      handleColumn,
      publicEmailColumn,
      hashtagsColumn,
      tasksColumn,
      followersColumn,
      postsColumn,
      subscribersColumn,
      lastUpdatedColumn
    ],
    [
      userIdColumn,
      handleColumn,
      publicEmailColumn,
      hashtagsColumn,
      tasksColumn,
      followersColumn,
      postsColumn,
      subscribersColumn,
      lastUpdatedColumn
    ]
  );

  /**
   * Template column factory - creates columns based on parameter keys
   * @param {string} paramKey - Parameter key from Mediafy config
   * @returns {Object|null} Column definition
   */
  const templateColumnFactory = useCallback(
    (paramKey) => {
      switch (paramKey) {
        case 'id':
          return identityColumnMap.id;
        case 'login':
          return identityColumnMap.login;
        case 'email':
          return identityColumnMap.email;
        case 'fol_cnt':
          return followersColumn;
        case 'sub_cnt':
          return subscribersColumn;
        case 'post_cnt':
          return postsColumn;
        case 'name':
          return {
            id: 'name',
            header: 'Profile Name',
            sortable: true,
            minWidth: 200,
            accessor: (row) => row.name,
            render: renderProfileName
          };
        case 'biography':
          return {
            id: 'biography',
            header: 'Bio',
            sortable: false,
            minWidth: 280,
            accessor: (row) => row.biography,
            render: renderBio
          };
        case 'post_date':
          return {
            id: 'post_date',
            header: 'Last Post',
            sortable: true,
            minWidth: 180,
            accessor: (row) => row.post_date,
            render: renderLastPost
          };
        case 'privacy':
          return {
            id: 'privacy',
            header: 'Privacy',
            sortable: true,
            minWidth: 140,
            accessor: (row) => row.privacy,
            render: renderPrivacy
          };
        case 'business':
          return {
            id: 'business',
            header: 'Business',
            sortable: true,
            minWidth: 140,
            accessor: (row) => row.business,
            render: renderBusiness
          };
        case 'verify':
          return {
            id: 'verify',
            header: 'Verified',
            sortable: true,
            minWidth: 140,
            accessor: (row) => row.verify,
            render: renderVerified
          };
        case 'phone': {
          return {
            id: 'public_phone',
            header: 'Public Phone',
            sortable: false,
            minWidth: 200,
            accessor: (row) =>
              row.public_phone_number ||
              row.phone ||
              (row.public_phone_country_code
                ? `${row.public_phone_country_code}`
                : ''),
            render: renderPublicPhone
          };
        }
        case 'link':
          return {
            id: 'link',
            header: 'Profile Link',
            sortable: false,
            minWidth: 220,
            accessor: (row) => row.link,
            render: renderProfileLink
          };
        case 'category':
          return {
            id: 'category',
            header: 'Category',
            sortable: true,
            minWidth: 150,
            accessor: (row) => row.category,
            render: renderCategory
          };
        default:
          return null;
      }
    },
    [identityColumnMap, followersColumn, subscribersColumn, postsColumn]
  );

  /**
   * Generate columns based on selected Mediafy config
   * @returns {Array} Column definitions
   */
  const usersWithEmailsColumns = useMemo(() => {
    if (!selectedMediafyConfig || !(selectedMediafyConfig.parameters || []).length) {
      return legacyColumns;
    }

    const uniqueParams = Array.from(new Set(selectedMediafyConfig.parameters));
    const orderedFromTemplate = uniqueParams
      .map((key) => templateColumnFactory(key))
      .filter(Boolean);

    // Ensure essential identity columns exist even if template omitted them
    const ensureColumn = (col, index) => {
      if (!orderedFromTemplate.some((existing) => existing.id === col.id)) {
        orderedFromTemplate.splice(Math.min(index, orderedFromTemplate.length), 0, col);
      }
    };
    ensureColumn(identityColumnMap.id, 0);
    ensureColumn(identityColumnMap.login, 1);
    ensureColumn(identityColumnMap.email, 2);

    const deduped = [];
    const seen = new Set();
    [...orderedFromTemplate, ...enterpriseContextColumns].forEach((col) => {
      if (!col || seen.has(col.id)) return;
      seen.add(col.id);
      deduped.push(col);
    });

    return deduped.length ? deduped : legacyColumns;
  }, [
    selectedMediafyConfig,
    legacyColumns,
    templateColumnFactory,
    identityColumnMap,
    enterpriseContextColumns
  ]);

  // Return controller interface
  return {
    // Base columns
    userIdColumn,
    handleColumn,
    publicEmailColumn,
    hashtagsColumn,
    tasksColumn,
    followersColumn,
    postsColumn,
    subscribersColumn,
    lastUpdatedColumn,
    
    // Column maps
    identityColumnMap,
    enterpriseContextColumns,
    legacyColumns,
    
    // Dynamic columns
    usersWithEmailsColumns,
    templateColumnFactory
  };
};

