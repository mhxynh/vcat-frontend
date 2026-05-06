import { ACTIONS, ROLES } from '../../auth';

export const HELP_SECTION_TYPES = {
  PARAGRAPH: 'paragraph',
  STEPS: 'steps',
  TIP: 'tip',
  WARNING: 'warning',
  PERMISSION: 'permission',
};

export const HELP_MEDIA_TYPES = {
  GIF: 'gif',
  VIDEO: 'video',
};

export const HELP_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the core workspace, navigation, and dashboard patterns.',
    order: 10,
  },
  {
    id: 'controls',
    title: 'Controls',
    description: 'Create, import, review, edit, and retire control records.',
    order: 20,
  },
  {
    id: 'requests',
    title: 'Requests',
    description: 'Create requests, assign work, and track request status.',
    order: 30,
  },
  {
    id: 'testing',
    title: 'Testing',
    description: 'Use the tracker, kanban, calendar, and test detail workflows.',
    order: 40,
  },
  {
    id: 'admin',
    title: 'Admin',
    description: 'Understand permissions, role behavior, and restricted actions.',
    order: 50,
  },
];

export const HELP_DOCS = [
  {
    id: 'platform-overview',
    title: 'Platform Overview',
    categoryId: 'getting-started',
    order: 10,
    summary: 'Understand the main areas of the control testing workspace.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_SUMMARY, ACTIONS.VIEW_CONTROLS, ACTIONS.VIEW_TESTS],
    keywords: ['overview', 'dashboard', 'catalog', 'tracker', 'navigation', 'home'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/platform-overview.mp4',
      poster: '/help-assets/platform-overview-poster.png',
      title: 'Platform overview walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'The application is organized around Dashboard, Catalog, Tracker, and Help. Dashboard summarizes progress, Catalog manages control metadata, and Tracker manages testing work.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Common navigation flow',
        items: [
          'Open Dashboard to review progress and capacity.',
          'Open Catalog to find or manage control metadata.',
          'Open Tracker to work with controls, requests, kanban, and calendar views.',
          'Open Help when you need workflow instructions or permission details.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Most day-to-day testing work happens in Tracker. Catalog is best for control metadata, and Dashboard is best for progress and capacity review.',
      },
    ],
  },
  {
    id: 'using-dashboard',
    title: 'Using the Dashboard',
    categoryId: 'getting-started',
    order: 20,
    summary: 'Read summary cards, distribution charts, progress updates, and capacity.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_SUMMARY, ACTIONS.EXPORT_SUMMARY],
    keywords: ['dashboard', 'summary', 'capacity', 'progress', 'distribution', 'export'],
    media: {
      type: HELP_MEDIA_TYPES.GIF,
      src: '/help-assets/using-dashboard.gif',
      title: 'Dashboard walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'The dashboard gives a high-level view of testing progress, open work, blocked controls, DAT and OET distribution, and team capacity.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Review dashboard progress',
        items: [
          'Open Dashboard from the top navigation.',
          'Review the summary cards for total controls, open work, completed work, and blocked work.',
          'Use the DAT and OET distribution charts to understand where controls sit in the testing lifecycle.',
          'Review Team Capacity to see assigned work and in-progress workload by tester.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Use Refresh when you want the latest dashboard data after making changes in Tracker.',
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.EXPORT_SUMMARY,
        body: 'Managers and testers can export dashboard summary data.',
      },
    ],
  },
  {
    id: 'exporting-dashboard',
    title: 'Exporting Dashboard Data',
    categoryId: 'getting-started',
    order: 30,
    summary: 'Export dashboard summary data for offline review or reporting.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.EXPORT_SUMMARY],
    keywords: ['dashboard export', 'export dashboard', 'summary export', 'download report'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/exporting-dashboard.mp4',
      poster: '/help-assets/exporting-dashboard-poster.png',
      title: 'Exporting dashboard data walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Export summary data',
        items: [
          'Open Dashboard.',
          'Wait for dashboard data to finish loading.',
          'Select Export in the page header.',
          'Use the downloaded file for reporting or offline review.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'If the page is still loading, the export button may be temporarily disabled to prevent downloading stale or incomplete data.',
      },
    ],
  },
  {
    id: 'finding-controls',
    title: 'Finding Controls',
    categoryId: 'controls',
    order: 10,
    summary: 'Search and review active or retired controls in the catalog.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_CONTROLS],
    keywords: ['catalog', 'controls', 'search controls', 'vgcpid', 'control owner', 'sme'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/finding-controls.mp4',
      poster: '/help-assets/finding-controls-poster.png',
      title: 'Finding controls walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Find a control',
        items: [
          'Open Catalog from the top navigation.',
          'Use the search bar to find a control by VGCPID, owner, SME, or description.',
          'Open a control row to review metadata, test history, and request history.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Search works best with specific identifiers like VGCPID values or owner names.',
      },
    ],
  },
  {
    id: 'creating-controls',
    title: 'Creating Controls',
    categoryId: 'controls',
    order: 20,
    summary: 'Create a new control record from the catalog.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.CREATE_CONTROL],
    keywords: ['create control', 'new control', 'add control', 'catalog', 'vgcpid'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/creating-controls.mp4',
      poster: '/help-assets/creating-controls-poster.png',
      title: 'Creating controls walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Create a control',
        items: [
          'Open Catalog.',
          'Select Add Control.',
          'Enter the control ID, description, owner, SME, and escalation details.',
          'Submit the form.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Use a stable VGCPID and clear description. Other workflows use the control record as the source of truth.',
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.CREATE_CONTROL,
        body: 'Only managers can create controls.',
      },
    ],
  },
  {
    id: 'importing-controls',
    title: 'Importing Controls',
    categoryId: 'controls',
    order: 30,
    summary: 'Import control metadata from a CSV or Excel file.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.IMPORT_CONTROLS],
    keywords: [
      'import controls',
      'csv import',
      'excel import',
      'upload controls',
      'catalog import',
    ],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/importing-controls.mp4',
      poster: '/help-assets/importing-controls-poster.png',
      title: 'Importing controls walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Import controls',
        items: [
          'Open Catalog.',
          'Select Import.',
          'Choose a CSV or supported Excel file.',
          'Confirm the file uses the expected control template columns.',
          'Submit the import and refresh the catalog after upload completes.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Do not rename template columns. The import validates the header row before uploading.',
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.IMPORT_CONTROLS,
        body: 'Only managers can import control metadata.',
      },
    ],
  },
  {
    id: 'editing-controls',
    title: 'Editing Controls',
    categoryId: 'controls',
    order: 40,
    summary: 'Update control metadata when owner, SME, description, or escalation details change.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.UPDATE_CONTROL, ACTIONS.CHANGE_CATALOG_CONTROL_ID],
    keywords: ['edit control', 'update control', 'control owner', 'control sme', 'change vgcpid'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/editing-controls.mp4',
      poster: '/help-assets/editing-controls-poster.png',
      title: 'Editing controls walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Edit a control',
        items: [
          'Open Catalog.',
          'Search for the control.',
          'Open the control details view.',
          'Select Edit.',
          'Update the metadata fields and save.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Changing a control identifier can affect how users search for and recognize the control. Confirm the change before saving.',
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.UPDATE_CONTROL,
        body: 'Only managers can update control metadata.',
      },
    ],
  },
  {
    id: 'retiring-controls',
    title: 'Retiring Controls',
    categoryId: 'controls',
    order: 50,
    summary: 'Retire controls that should no longer appear as active catalog items.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.RETIRE_CONTROL, ACTIONS.DELETE_CONTROL_HARD],
    keywords: ['retire control', 'archive control', 'delete control', 'inactive control'],
    media: {
      type: HELP_MEDIA_TYPES.GIF,
      src: '/help-assets/retiring-controls.gif',
      title: 'Retiring controls walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Retire a control',
        items: [
          'Open Catalog.',
          'Find and open the control.',
          'Review active tests and request history.',
          'Use the retire or remove action only after confirming the control should leave active workflows.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Retiring is safer than hard removal because it preserves history. Use permanent removal only when the record should not exist.',
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.RETIRE_CONTROL,
        body: 'Only managers can retire controls.',
      },
    ],
  },
  {
    id: 'exporting-catalog',
    title: 'Exporting the Catalog',
    categoryId: 'controls',
    order: 60,
    summary: 'Download catalog control data for offline review.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_CONTROLS],
    keywords: ['export catalog', 'download controls', 'control export', 'catalog csv'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/exporting-catalog.mp4',
      poster: '/help-assets/exporting-catalog-poster.png',
      title: 'Exporting the catalog walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Export catalog data',
        items: [
          'Open Catalog.',
          'Wait for controls to load.',
          'Select Export in the page header.',
          'Open the downloaded file to review catalog data outside the app.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Use search and filters in the app for live review. Use export when you need a file for reporting, reconciliation, or sharing.',
      },
    ],
  },
  {
    id: 'creating-requests',
    title: 'Creating Requests',
    categoryId: 'requests',
    order: 10,
    summary: 'Create a request so testing work can be assigned and tracked.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.CREATE_REQUEST, ACTIONS.ASSIGN_TESTER_TO_REQUEST],
    keywords: ['create request', 'new request', 'add request', 'assign tester', 'request status'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/creating-requests.mp4',
      poster: '/help-assets/creating-requests-poster.png',
      title: 'Creating requests walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Create a request',
        items: [
          'Open Tracker.',
          'Select the Requests tab.',
          'Select Add Request.',
          'Fill out priority, requestor, due date, and description.',
          'Submit the request.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Requests should include enough detail for testers to understand the requested control work.',
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Use a due date and priority that reflect the business timeline. This helps testers prioritize their assigned work.',
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.CREATE_REQUEST,
        body: 'Only managers can create requests.',
      },
    ],
  },
  {
    id: 'request-list-and-filters',
    title: 'Using the Requests Tab',
    categoryId: 'requests',
    order: 20,
    summary: 'Find, filter, open, and review requests in Tracker.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_TESTS],
    keywords: [
      'requests tab',
      'filter requests',
      'request search',
      'priority filter',
      'overdue requests',
    ],
    media: {
      type: HELP_MEDIA_TYPES.GIF,
      src: '/help-assets/request-list-and-filters.gif',
      title: 'Requests tab walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Review requests',
        items: [
          'Open Tracker.',
          'Select Requests.',
          'Use search to find requests by ID, requestor, priority, status, description, or related controls.',
          'Use filters to narrow the list by priority or overdue state.',
          'Open a request to review status, related controls, comments, and audit history.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'The request row shows completion progress so you can quickly see how much associated testing is done.',
      },
    ],
  },
  {
    id: 'assigning-requests',
    title: 'Assigning Requests',
    categoryId: 'requests',
    order: 30,
    summary: 'Assign all controls in a request to a tester.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.ASSIGN_TESTER_TO_REQUEST],
    keywords: ['assign request', 'bulk assign request', 'assign tester', 'request controls'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/assigning-requests.mp4',
      poster: '/help-assets/assigning-requests-poster.png',
      title: 'Assigning requests walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Assign request controls',
        items: [
          'Open Tracker.',
          'Select Requests.',
          'Open the request you want to assign.',
          'Choose the assign action.',
          'Select a tester and add a reason if needed.',
          'Confirm the assignment.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Assigning a request updates the tester assignment for all associated controls in that request.',
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.ASSIGN_TESTER_TO_REQUEST,
        body: 'Only managers can assign testers to requests.',
      },
    ],
  },
  {
    id: 'request-statuses',
    title: 'Request Statuses',
    categoryId: 'requests',
    order: 40,
    summary: 'Understand how request statuses describe request progress.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_TESTS],
    keywords: ['request status', 'not started', 'in progress', 'completed', 'blocked', 'archived'],
    media: null,
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'Request status summarizes where the request sits in the workflow. Common statuses include Not Started, In Progress, Completed, Blocked, and Archived.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Read request status',
        items: [
          'Use Not Started for requests that have not begun.',
          'Use In Progress when related testing work is underway.',
          'Use Completed when the request is finished.',
          'Use Blocked when work cannot continue without help or missing information.',
          'Use Archived when the request should leave active views while preserving history.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Open the request details view to see related control-level statuses and comments before changing status.',
      },
    ],
  },
  {
    id: 'archiving-requests',
    title: 'Archiving Requests',
    categoryId: 'requests',
    order: 50,
    summary: 'Archive or unarchive requests when they should leave or return to active views.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.ARCHIVE_REQUEST, ACTIONS.REMOVE_REQUEST],
    keywords: ['archive request', 'unarchive request', 'remove request', 'delete request'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/archiving-requests.mp4',
      poster: '/help-assets/archiving-requests-poster.png',
      title: 'Archiving requests walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Archive a request',
        items: [
          'Open Tracker.',
          'Select Requests.',
          'Open the request details view.',
          'Review related controls and comments.',
          'Select Archive Request and confirm.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Archived requests leave active views, but history remains available. Completed requests should not be permanently removed.',
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.ARCHIVE_REQUEST,
        body: 'Only managers can archive requests.',
      },
    ],
  },
  {
    id: 'working-tests',
    title: 'Working Tests',
    categoryId: 'testing',
    order: 10,
    summary: 'Review assigned tests, update testing progress, and add evidence links.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_TESTS, ACTIONS.UPDATE_TEST, ACTIONS.COMMENT],
    keywords: ['tests', 'controls tracker', 'assigned tests', 'evidence', 'comments', 'status'],
    media: {
      type: HELP_MEDIA_TYPES.GIF,
      src: '/help-assets/working-tests.gif',
      title: 'Working tests walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Update a test',
        items: [
          'Open Tracker.',
          'Select the Controls tab.',
          'Open the test details.',
          'Update progress, comments, or evidence links as needed.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Use comments to preserve review context when testing status changes.',
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Keep status, due dates, evidence, and comments aligned so reviewers can understand the current state without asking for extra context.',
      },
    ],
  },
  {
    id: 'tracker-controls-tab',
    title: 'Using the Controls Tab',
    categoryId: 'testing',
    order: 20,
    summary: 'Search, filter, select, assign, export, and open control tests in Tracker.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_TESTS, ACTIONS.UPDATE_TEST, ACTIONS.BULK_ASSIGN_TESTERS],
    keywords: ['controls tab', 'test table', 'filter tests', 'bulk assign', 'control tests'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/tracker-controls-tab.mp4',
      poster: '/help-assets/tracker-controls-tab-poster.png',
      title: 'Controls tab walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Use the controls tab',
        items: [
          'Open Tracker.',
          'Select Controls.',
          'Use search to find tests by control ID, status, tester, owner, or description.',
          'Use the filter menu to narrow tests by status, test type, tester, or overdue state.',
          'Open a row to review full test details.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.BULK_ASSIGN_TESTERS,
        body: 'Only managers can bulk assign testers from the Controls tab.',
      },
    ],
  },
  {
    id: 'creating-tests',
    title: 'Creating Control Tests',
    categoryId: 'testing',
    order: 30,
    summary: 'Create a new control test from Tracker.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.CREATE_TEST],
    keywords: ['create test', 'add control test', 'new test', 'dat', 'oet'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/creating-tests.mp4',
      poster: '/help-assets/creating-tests-poster.png',
      title: 'Creating control tests walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Create a test',
        items: [
          'Open Tracker.',
          'Select Controls.',
          'Select Add Control Test.',
          'Choose the related request and control.',
          'Set DAT or OET requirements, dates, priority, and tester assignment.',
          'Submit the test.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.CREATE_TEST,
        body: 'Only managers can create new control tests.',
      },
    ],
  },
  {
    id: 'updating-test-progress',
    title: 'Updating Test Progress',
    categoryId: 'testing',
    order: 40,
    summary: 'Update DAT/OET progress, status, dates, and tester assignment.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.UPDATE_TEST],
    keywords: ['update test', 'dat step', 'oet step', 'testing ready', 'walkthrough', 'completed'],
    media: {
      type: HELP_MEDIA_TYPES.GIF,
      src: '/help-assets/updating-test-progress.gif',
      title: 'Updating test progress walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'Test progress records where DAT and OET work stands. Status and step values should reflect the latest known testing state.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Update progress',
        items: [
          'Open a test from Tracker, Kanban, Calendar, or Dashboard.',
          'Review the current DAT and OET steps.',
          'Update the relevant progress fields.',
          'Add comments or evidence links when the update needs explanation.',
          'Save the changes.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Use clear comments when moving work to Blocked, Addressing Comments, or Completed.',
      },
    ],
  },
  {
    id: 'evidence-links',
    title: 'Adding Evidence Links',
    categoryId: 'testing',
    order: 50,
    summary: 'Attach external supporting evidence links to a control test.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.UPDATE_TEST],
    keywords: ['evidence', 'attachments', 'supporting document', 'screenshots', 'links'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/evidence-links.mp4',
      poster: '/help-assets/evidence-links-poster.png',
      title: 'Evidence links walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Add evidence',
        items: [
          'Open the test details view.',
          'Find the evidence or attachment area.',
          'Choose Add Attachment Link.',
          'Paste the supporting link and provide a clear label if prompted.',
          'Save the evidence link.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Do not add links that users cannot access. Evidence should be stored in an approved location before linking it in the app.',
      },
    ],
  },
  {
    id: 'comments',
    title: 'Using Comments',
    categoryId: 'testing',
    order: 60,
    summary: 'Add comments to requests or tests to preserve review context.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.COMMENT],
    keywords: ['comments', 'add comment', 'delete comment', 'request comments', 'test comments'],
    media: {
      type: HELP_MEDIA_TYPES.GIF,
      src: '/help-assets/comments.gif',
      title: 'Using comments walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Add a comment',
        items: [
          'Open a request or test details view.',
          'Find the comments area.',
          'Enter a concise update, blocker, review note, or decision.',
          'Submit the comment.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Good comments explain what changed, why it changed, and what action is needed next.',
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'You can only delete comments you posted.',
      },
    ],
  },
  {
    id: 'kanban-view',
    title: 'Using Kanban',
    categoryId: 'testing',
    order: 70,
    summary: 'Use Kanban to scan test work by workflow status.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_TESTS],
    keywords: ['kanban', 'board', 'status columns', 'testing ready', 'blocked', 'completed'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/kanban-view.mp4',
      poster: '/help-assets/kanban-view-poster.png',
      title: 'Kanban view walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Review work in Kanban',
        items: [
          'Open Tracker.',
          'Select Kanban.',
          'Scan columns to understand how testing work is distributed by status.',
          'Use card priority, assignee initials, and status labels to identify work needing attention.',
          'Open a card when you need full test details.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Kanban is best for workflow review. Use the Controls tab when you need table search, filters, selection, or exports.',
      },
    ],
  },
  {
    id: 'calendar-view',
    title: 'Using Calendar',
    categoryId: 'testing',
    order: 80,
    summary: 'Use Calendar to see test work by date, assignee, and status.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_TESTS],
    keywords: ['calendar', 'due dates', 'test dates', 'assignee', 'status legend'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/calendar-view.mp4',
      poster: '/help-assets/calendar-view-poster.png',
      title: 'Calendar view walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Review calendar work',
        items: [
          'Open Tracker.',
          'Select Calendar.',
          'Use the status legend to understand each calendar marker.',
          'Select a day to review scheduled or due testing work.',
          'Open an item for full test details.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Calendar is useful for date planning and workload awareness. It complements Dashboard capacity and Kanban status review.',
      },
    ],
  },
  {
    id: 'bulk-assign-tests',
    title: 'Bulk Assigning Tests',
    categoryId: 'testing',
    order: 90,
    summary: 'Assign multiple selected tests to a tester from the Controls tab.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.BULK_ASSIGN_TESTERS, ACTIONS.ASSIGN_TESTER],
    keywords: ['bulk assign', 'assign tests', 'selected tests', 'tester assignment'],
    media: {
      type: HELP_MEDIA_TYPES.GIF,
      src: '/help-assets/bulk-assign-tests.gif',
      title: 'Bulk assigning tests walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Bulk assign selected tests',
        items: [
          'Open Tracker.',
          'Select Controls.',
          'Select one or more test rows.',
          'Choose Bulk Assign.',
          'Select the tester and add a reason if needed.',
          'Confirm the assignment.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Bulk assignment updates every selected test. Review the selected count before confirming.',
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.BULK_ASSIGN_TESTERS,
        body: 'Only managers can bulk assign testers.',
      },
    ],
  },
  {
    id: 'test-archive-delete',
    title: 'Archiving Tests',
    categoryId: 'testing',
    order: 100,
    summary: 'Archive or unarchive control tests when they should leave or return to active views.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.ARCHIVE_CONTROL_TEST, ACTIONS.DELETE_CONTROL_TEST],
    keywords: [
      'archive test',
      'unarchive test',
      'delete test',
      'remove test',
      'control test archive',
    ],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/test-archive-delete.mp4',
      poster: '/help-assets/test-archive-delete-poster.png',
      title: 'Archiving tests walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Archive a test',
        items: [
          'Open the test details view.',
          'Review comments, evidence, and request context.',
          'Choose Archive Control Test.',
          'Confirm the archive action.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Archived tests are removed from active views but can be restored. Permanent deletion should be used carefully.',
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.ARCHIVE_CONTROL_TEST,
        body: 'Only managers can archive control tests.',
      },
    ],
  },
  {
    id: 'audit-history',
    title: 'Using Audit History',
    categoryId: 'admin',
    order: 5,
    summary: 'Review change history for requests, controls, and tests.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_VERSION_HISTORY],
    keywords: ['audit history', 'version history', 'changes', 'restore', 'rollback'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/audit-history.mp4',
      poster: '/help-assets/audit-history-poster.png',
      title: 'Audit history walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'Audit history shows important changes over time, including field changes, status changes, and archive actions.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Review history',
        items: [
          'Open a request, control, or test details view.',
          'Find the audit or version history area.',
          'Review the changed fields, previous values, new values, actor, and date.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.VERSION_RESTORE,
        body: 'Only managers can restore previous versions.',
      },
    ],
  },
  {
    id: 'understanding-rbac',
    title: 'Understanding Permissions',
    categoryId: 'admin',
    order: 10,
    summary: 'Understand what managers and testers can do in the application.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [],
    keywords: ['rbac', 'roles', 'manager', 'tester', 'permissions', 'restricted actions'],
    media: null,
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'Permissions are based on Cognito groups. Managers can perform administrative actions. Testers can view work, update tests, comment, export summaries, and review version history.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Manager permissions',
        items: [
          'Create, update, import, retire, and remove controls.',
          'Create, update, archive, and remove requests.',
          'Create, assign, archive, and remove control tests.',
          'Bulk assign testers and restore previous versions.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Tester permissions',
        items: [
          'View controls, tests, dashboard summaries, and version history.',
          'Update tests and add comments.',
          'Export dashboard summary data.',
          'Review manager-only workflows in Help when context is needed.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'If an action appears disabled, your current role probably does not include that permission.',
      },
    ],
  },
  {
    id: 'restricted-actions',
    title: 'Restricted Actions',
    categoryId: 'admin',
    order: 20,
    summary: 'Understand why some buttons appear disabled and what to do next.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [],
    keywords: ['restricted action', 'disabled button', 'permission denied', 'manager only'],
    media: null,
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'The app disables actions that your role cannot perform. Restricted buttons usually include a message explaining which role is required.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'What to do when an action is restricted',
        items: [
          'Read the permission message on the disabled action.',
          'Confirm whether the workflow is manager-only or tester-available.',
          'If the change is needed, ask a manager to perform the action.',
          'If your role looks incorrect, contact an administrator to review your Cognito group assignment.',
        ],
      },
    ],
  },
  {
    id: 'manager-day-to-day',
    title: 'Manager Daily Workflow',
    categoryId: 'admin',
    order: 30,
    summary: 'A recommended daily flow for managers overseeing control testing work.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.VIEW_SUMMARY, ACTIONS.ASSIGN_TESTER, ACTIONS.CREATE_REQUEST],
    keywords: [
      'manager workflow',
      'daily review',
      'capacity',
      'blocked controls',
      'assign testers',
    ],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/manager-day-to-day.mp4',
      poster: '/help-assets/manager-day-to-day-poster.png',
      title: 'Manager daily workflow walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Daily manager review',
        items: [
          'Start in Dashboard to review totals, blocked work, and capacity.',
          'Open Tracker Controls to review overdue or blocked tests.',
          'Use Requests to review new or high-priority work.',
          'Use Kanban to scan workflow bottlenecks.',
          'Assign or rebalance work as needed.',
          'Archive completed or inactive items only after reviewing context.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Dashboard is the best starting point. Tracker is where managers take action.',
      },
    ],
  },
  {
    id: 'tester-day-to-day',
    title: 'Tester Daily Workflow',
    categoryId: 'admin',
    order: 40,
    summary: 'A recommended daily flow for testers completing assigned work.',
    roles: [ROLES.TESTER, ROLES.MANAGER],
    permissions: [ACTIONS.VIEW_TESTS, ACTIONS.UPDATE_TEST, ACTIONS.COMMENT],
    keywords: ['tester workflow', 'assigned tests', 'daily testing', 'comments', 'evidence'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/tester-day-to-day.mp4',
      poster: '/help-assets/tester-day-to-day-poster.png',
      title: 'Tester daily workflow walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Daily tester review',
        items: [
          'Open Tracker Controls and filter to your assigned tests.',
          'Review overdue, blocked, and in-progress work first.',
          'Open each assigned test to update progress, comments, and evidence links.',
          'Use Calendar to understand upcoming due dates.',
          'Use comments to flag blockers or decisions for managers.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'When you cannot move a test forward, add a comment explaining the blocker instead of leaving the record silent.',
      },
    ],
  },
];

export function getHelpCategoryById(categoryId) {
  return HELP_CATEGORIES.find((category) => category.id === categoryId) || null;
}

export function sortHelpCategories(categories = HELP_CATEGORIES) {
  return [...categories].sort((left, right) => left.order - right.order);
}

export function sortHelpDocs(docs = HELP_DOCS) {
  return [...docs].sort((left, right) => {
    if (left.categoryId !== right.categoryId) {
      const leftCategory = getHelpCategoryById(left.categoryId);
      const rightCategory = getHelpCategoryById(right.categoryId);
      return (leftCategory?.order ?? 0) - (rightCategory?.order ?? 0);
    }

    return left.order - right.order;
  });
}

export function getHelpDocsByCategory(categoryId, docs = HELP_DOCS) {
  return sortHelpDocs(docs).filter((doc) => doc.categoryId === categoryId);
}

export function userCanAccessHelpDoc(doc, role) {
  if (!doc || !Array.isArray(doc.roles) || doc.roles.length === 0) return true;
  return doc.roles.includes(role);
}

export function getHelpDocAccessLabel(doc, role) {
  if (userCanAccessHelpDoc(doc, role)) return 'Available';
  if (Array.isArray(doc?.roles) && doc.roles.length === 1) return `${doc.roles[0]} only`;
  if (Array.isArray(doc?.roles) && doc.roles.length > 1) return `${doc.roles.join(', ')} only`;
  return 'Restricted';
}
