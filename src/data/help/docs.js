import { ACTIONS, ROLES } from '../../auth';

/**
 * Future scaling note:
 * If we add context-aware help later, extend each help doc with `contextKeys`
 * such as `tracker-requests-tab`, `create-request-modal`, or `calendar-view`.
 * Then add helpers like `getHelpDocsByContext(contextKey)` so pages, modals,
 * or onboarding tours can surface related articles without hardcoding links.
 */

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
  {
    id: 'troubleshooting',
    title: 'Troubleshooting & Support',
    description: 'Resolve common errors, validate forms, and find help.',
    order: 55,
  },
];

export const HELP_DOCS = [
  {
    id: 'quickstart',
    title: 'Quickstart: Your First 5 Minutes',
    categoryId: 'getting-started',
    order: 5,
    summary:
      'Get started quickly: log in, view your dashboard, and complete your first test update.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_SUMMARY, ACTIONS.VIEW_TESTS, ACTIONS.UPDATE_TEST],
    keywords: [
      'quickstart',
      'first time',
      'getting started',
      'how to begin',
      'onboarding',
      'first steps',
    ],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/quickstart.mp4',
      poster: '/help-assets/quickstart-poster.png',
      title: 'Quickstart walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Get started in 5 minutes',
        items: [
          'Log in with your Vanguard credentials. You will be redirected to Cognito for authentication.',
          'You will see the Dashboard. This page shows your testing progress, blocked work, and team capacity.',
          'Click the Tracker link in the top navigation to see assigned tests.',
          'Click the Controls tab to view the active tests list. You will see controls grouped by request and status.',
          'Click on a test row to open the test details modal. You can see the control details, current status, and workflow steps.',
          'Under the status section, update the test (e.g., mark as In Progress, add a comment, or attach evidence).',
          'Click Save. A confirmation modal will appear. Your change has been recorded in the audit history.',
          'Congratulations! You have completed your first test update. For more details on any workflow, explore this Help Center.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'The Dashboard is the best overview of progress. Tracker is where you do the work. Help Center is always available for detailed guidance on any workflow.',
      },
    ],
  },
  {
    id: 'glossary-and-data-model',
    title: 'Glossary & Data Model',
    categoryId: 'getting-started',
    order: 12,
    summary: 'Learn key terms and how Controls, Requests, and Tests are related.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [],
    keywords: [
      'glossary',
      'terms',
      'definitions',
      'data model',
      'relationships',
      'control',
      'request',
      'test',
      'dat',
      'oet',
      'vgcpid',
    ],
    media: null,
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'Understanding the key terms and how data relates will help you use V-CAT more effectively. Below is a glossary of common terms and a simple data model showing how Controls, Requests, and Tests are connected.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Key terms',
        items: [
          'Control: A specific procedure or policy implemented to mitigate risk or achieve an objective. Each control has a lifecycle status (Active or Retired).',
          'VGCPID: Vanguard Governance & Compliance Program identifier — a unique ID for each control (e.g., CTRL-001).',
          'DAT: Design and Operational Effectiveness Testing — testing to verify a control is designed and operates correctly.',
          'OET: Operational Effectiveness Testing — testing to verify a control operates effectively over time.',
          'Request: A container grouping one or more Controls submitted for testing by an auditor, regulator, or internally.',
          'Test: The formal activity of evaluating the design or operational effectiveness of a specific Control.',
          'Tester: A user assigned to execute and document the results of one or more Tests.',
          'Manager: A user who oversees the testing cycle, assigns testers, and monitors progress.',
          'Audit Trail / Version History: A complete, immutable record of all changes to Controls, Requests, and Tests. Each change is timestamped and includes the user who made it.',
          "Available Bandwidth: A tester's capacity to accept new work, calculated by the number of active Tests and risk distribution (how many high-risk controls are assigned).",
        ],
      },
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'Data Model: A Request contains one or more Tests. Each Test is linked to exactly one Control. Each Test is assigned to exactly one Tester. A Control can appear in multiple Tests across different Requests over time.',
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Managers often create Requests and assign all Tests in a Request to one Tester. Testers then work through their assigned Tests, moving through DAT and OET steps, updating progress and adding evidence. This streamlines workload assignment and tracking.',
      },
    ],
  },
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
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/using-dashboard.mp4',
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
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/retiring-controls.mp4',
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
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/request-list-and-filters.mp4',
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
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/working-tests.mp4',
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
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/updating-test-progress.mp4',
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
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/comments.mp4',
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
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/bulk-assign-tests.mp4',
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
    id: 'required-fields-validation',
    title: 'Required Fields & Validation',
    categoryId: 'troubleshooting',
    order: 10,
    summary: 'Learn which fields are required in each form and what to do if validation fails.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.CREATE_CONTROL, ACTIONS.CREATE_REQUEST, ACTIONS.CREATE_TEST],
    keywords: [
      'required fields',
      'validation',
      'error',
      'form',
      'create control',
      'create request',
      'create test',
    ],
    media: null,
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'All forms in V-CAT require certain fields to be filled before you can submit. If a required field is empty or invalid, you will see an error message next to the field. Below are the required fields for each form type and common validation errors.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Creating a Control (Managers only)',
        items: [
          'VGCPID (required): A unique control identifier (e.g., CTRL-001). Error: "VGCPID is required" or "VGCPID already exists." Fix: Enter a unique control ID.',
          'Description (required): A brief explanation of the control. Error: "Description is required." Fix: Provide a 1-2 sentence description.',
          'Owner (required): The person responsible for control design. Error: "Owner is required." Fix: Select or enter an owner name.',
          'SME (required): Subject Matter Expert for the control. Error: "SME is required." Fix: Select or enter an SME name.',
          'Escalation (required): Yes or No. Error: "Escalation is required." Fix: Select "Yes" or "No."',
          'Escalation Contact (conditionally required): If Escalation = Yes, this field must be filled. Error: "Escalation Contact is required when Escalation is Yes." Fix: Enter contact name or email.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Creating a Request (Managers only)',
        items: [
          'Requestor (required): Who requested the testing cycle. Error: "Requestor is required." Fix: Enter a requestor name (e.g., "Internal Audit").',
          'Priority (required): High, Medium, or Low. Error: "Priority is required." Fix: Select a priority level.',
          'Due Date (required): When the request must be completed. Error: "Due Date is required" or "Due Date must be in the future." Fix: Enter a valid future date (MM/DD/YYYY).',
          'Description (required): Details about the request. Error: "Description is required." Fix: Provide a brief description of the request.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Creating a Test (Managers only)',
        items: [
          'Request (required): Which request this test belongs to. Error: "Request is required." Fix: Select a request from the dropdown.',
          'Control (required): Which control is being tested. Error: "Control is required." Fix: Select a control from the dropdown.',
          'Test Type (required): DAT, OET, or Both. Error: "Test Type is required." Fix: Select a test type.',
          'Priority (required): High, Medium, or Low. Error: "Priority is required." Fix: Select a priority level.',
          'Due Date (required): When the test must be completed. Error: "Due Date is required" or "Due Date must be in the future." Fix: Enter a valid future date (MM/DD/YYYY).',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'If a form is not submitting, check that all red-highlighted required fields are filled and valid. Empty required fields will show an error message when you try to submit.',
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Hover over the field label or error message to see more details about what is expected. If you are unsure about a field, check the Help Center article for that workflow.',
      },
    ],
  },
  {
    id: 'troubleshooting-common-errors',
    title: 'Troubleshooting & Common Errors',
    categoryId: 'troubleshooting',
    order: 20,
    summary: 'Resolve common issues, errors, and unexpected behaviors.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [],
    keywords: [
      'troubleshooting',
      'error',
      'help',
      'problem',
      'issue',
      'fix',
      'login',
      'dashboard',
      'search',
      'import',
      'export',
      'timeout',
      'not working',
    ],
    media: null,
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'If you encounter an error or unexpected behavior, use this guide to troubleshoot. If your issue is not listed or if the troubleshooting steps do not resolve it, contact your manager or admin for assistance.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Login & Authentication Issues',
        items: [
          '"I can\'t log in." → Verify your credentials are correct (email and password). Check that Caps Lock is off. Try clearing your browser cache and cookies, or use an incognito/private window. If still stuck, contact your admin.',
          '"I logged in but see \'Access Denied\'." → Your Cognito user group may not have been assigned. Contact your admin to add you to the "Managers" or "Testers" group.',
          '"Session expired; I was logged out." → This is normal for security. Simply log in again. Your work was auto-saved before logout.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Dashboard & Data Issues',
        items: [
          '"Dashboard shows no data or is blank." → Refresh the page and wait 5–10 seconds for data to load. Check your internet connection. If still blank, check the browser console for errors, then contact admin.',
          '"I see \"404: Page Not Found\"." → The page you tried to access does not exist. Use the top navigation to return to a valid page (Dashboard, Catalog, Tracker, Help).',
          '"Capacity metrics look wrong." → Refresh the page. If metrics are still incorrect, data may be out of sync; contact your admin.',
          '"Progress percentages don\'t add up." → Progress is calculated based on completed tests vs. total tests in a request. Refresh the page to see the latest calculation.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Search & Filter Issues',
        items: [
          '"Search returns no results for a control I know exists." → Try a shorter search term (e.g., "CTRL" instead of full VGCPID). Check spelling and ensure case matches (search is case-insensitive). If still no results, verify the control exists by asking your manager.',
          '"Filters reset to page 1 when I search." → This is intentional. Your filter is applied, and the view returns to page 1 to show filtered results clearly.',
          '"Pagination shows \"Page 1 of 0\"." → All records are hidden by current filters. Clear all filters or try a broader search term.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Create/Edit/Delete Issues',
        items: [
          '"Form validation error appears." → See the "Required Fields & Validation" article for field-specific errors and fixes.',
          '"I can\'t delete a control, request, or test." → Only Managers can delete; you may only see an Archive option. If deletion is necessary, ask your manager.',
          "\"Confirmation modal doesn't close after I click 'Confirm'.\" → Wait 5–10 seconds; the server is saving. If it hangs longer, refresh and verify the change was saved.",
          '"Changes don\'t appear after I save." → Refresh the page. Changes may not appear immediately if the server is processing. Auto-refresh should occur within a few seconds.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Import & Export Issues',
        items: [
          '"Import fails with validation error." → Check the error message (e.g., "Missing column VGCPID"). See "Import Template & CSV Guidance" article for common errors and fixes.',
          '"Import hangs or times out." → Your file may be too large. Try importing in smaller batches (< 5 MB). Close other tabs/apps to free up resources.',
          '"Export button is disabled/grayed out." → Wait for data to finish loading (check the loading spinner). The button will enable once data is ready.',
          '"Downloaded export file is empty or corrupted." → Re-run the export. If the file is still broken, contact your admin.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Workflow & Status Issues',
        items: [
          "\"I can't move a test to 'Completed'.\" → A required field may be missing (e.g., evidence link, comment, manager approval). Check the test details modal for error messages or missing fields.",
          '"Test status didn\'t change when I expected." → Some workflow transitions require manager approval. Check comments or ask your manager for the reason.',
          '"Bulk assign says \'Tester is required\'." → Select a tester from the dropdown before clicking "Assign Selected Tests."',
          '"I assigned a tester, but they didn\'t receive a notification." → In-app notifications are sent when assignments are made. Remind the tester to refresh their Tracker view.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Permissions & Role Issues',
        items: [
          '"I see a disabled button with a \'Manager only\' message." → This action requires Manager role. Ask your manager or admin if you need this capability.',
          '"My role looks wrong." → Roles are managed via Cognito groups by your admin. Contact your admin to verify your group assignment.',
          '"I suddenly lost access to something." → Your Cognito group or permissions may have changed. Contact your admin to verify your current access level.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Media & Asset Issues',
        items: [
          '"Help page shows \'Tutorial media coming soon\' or a broken image." → Some media files have not been uploaded yet. Refer to the written instructions in the article, or check back later.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'If your issue is not listed above, or if the troubleshooting steps do not resolve it, gather the following information and contact your manager or admin: (1) Screenshot of the error or problem, (2) Steps you took to reproduce it, (3) Your browser name and version (e.g., Chrome 125), (4) Your operating system (e.g., Windows 10), (5) Approximate date and time the error occurred.',
      },
    ],
  },
  {
    id: 'import-template-and-guidance',
    title: 'CSV/Excel Import Template & Guidance',
    categoryId: 'troubleshooting',
    order: 30,
    summary:
      'Download the import template and learn how to bulk-load controls, requests, or tests.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.CREATE_CONTROL, ACTIONS.CREATE_REQUEST],
    keywords: ['import', 'csv', 'excel', 'template', 'bulk', 'upload', 'spreadsheet', 'batch'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/import-template.mp4',
      poster: '/help-assets/import-template-poster.png',
      title: 'Import template and walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'Bulk imports allow you to load many records at once instead of creating them one-by-one. This guide explains the import format and common errors.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Get started with import',
        items: [
          'Click the Import button in the Catalog or Controls tab. A modal will open.',
          'Download the template (.xlsx file) from the modal. This file contains the exact column headers expected.',
          'Open the template in Excel or Google Sheets. Fill in your data rows (one record per row).',
          'Save your file as .csv or .xlsx and upload it via the modal. Click "Validate" to check for errors.',
          'If validation passes, click "Confirm Import" to load records. If errors appear, review the suggestions below.',
          'After import, verify records appear in the list. Some records may fail individually; review the import summary report.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Required columns and format',
        items: [
          'VGCPID: Unique control identifier. Must be unique across all controls. Example: "CTRL-001".',
          'Description: Control description. Must be 1–500 characters.',
          'Owner: Control owner name. Must match an existing user or email in the system.',
          'SME: Subject Matter Expert name. Must match an existing user or email.',
          'Escalation: "Yes" or "No". Determines whether escalation contact is required.',
          'Escalation Contact: If Escalation = "Yes", must be filled. Otherwise, leave blank. Format: Name or email.',
          'Status (optional): "Active" or "Retired". Defaults to "Active" if not specified.',
          'Additional fields (optional): Any custom metadata columns will be ignored and can be left blank.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Common import errors and fixes',
        items: [
          'Error: "Missing required column VGCPID." → The template is missing the VGCPID column header. Ensure the first row contains all required column names exactly as shown in the template.',
          'Error: "Duplicate VGCPID: CTRL-001." → You are trying to import a VGCPID that already exists. Either use a unique VGCPID or update the existing record instead of importing.',
          'Error: "Invalid Owner. User not found." → The Owner field does not match a user in the system. Check spelling and ensure the user is active. Contact your admin to add the user.',
          'Error: "Escalation Contact required when Escalation = Yes." → You set Escalation to "Yes" but left Escalation Contact blank. Either fill in the contact or change Escalation to "No."',
          'Error: "Invalid date format." → The date column must be formatted as MM/DD/YYYY or use a standard Excel date format. Do not use text like "Today" or "Next Week."',
          'Error: "File format not supported. Please use .csv or .xlsx." → Upload a CSV or Excel file, not PDF or other formats.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Handling partial failures',
        items: [
          'If some records pass validation but others fail, you will see a summary report.',
          'Download the failure report to see which rows failed and why.',
          'Fix the failing rows in your spreadsheet and re-upload. You can re-upload the same file; successful records will be skipped.',
          'Alternatively, create the failing records manually via the "Create" button if only a few are affected.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Always validate before confirming an import. Validation is free and safe—it checks for errors without saving anything. Once you confirm, records are added immediately.',
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Imports cannot be undone. If you import the wrong data, contact your admin to delete the records or roll back the database. Plan carefully and validate thoroughly before confirming.',
      },
    ],
  },
  {
    id: 'permissions-matrix',
    title: 'Role & Permissions Matrix',
    categoryId: 'admin',
    order: 10,
    summary: 'Understand what Managers and Testers can do in V-CAT.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [],
    keywords: [
      'permissions',
      'role',
      'manager',
      'tester',
      'access',
      'capabilities',
      'can i',
      'allowed',
    ],
    media: null,
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'V-CAT has two main roles: Manager and Tester. Each role has specific capabilities that determine what they can do in the system. Use this matrix to understand your permissions and know when to ask your manager or admin for help.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Manager capabilities',
        items: [
          'Create, edit, and delete Controls (import bulk controls).',
          'Create, edit, and delete Requests.',
          'Create, edit, and delete Tests.',
          'Assign Tests to Testers (bulk or individual).',
          'View all Requests, Controls, and Tests (even those not assigned to you).',
          'View all Testers and their workload (Available Bandwidth).',
          'View the Dashboard with team-wide progress and capacity metrics.',
          'Export data (Controls, Requests, Tests, audit history).',
          'View Audit Trail for all changes.',
          'Comment on Tests and Requests.',
          'View and manage request status and workflow.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Tester capabilities',
        items: [
          'View assigned Controls and Tests only (cannot see unassigned work).',
          'Update Test status (mark as In Progress, DAT Passed, OET Passed, etc.).',
          'Add comments to Tests and Requests.',
          'Attach evidence links and files to Tests.',
          'View the Tracker to see assigned work.',
          'View the Calendar to see due dates.',
          'View the Kanban board to visualize test workflow.',
          'View Dashboard (limited to own capacity and assigned work).',
          'Export their own assigned Tests.',
          'View Audit Trail (limited to changes they made or on their assigned Tests).',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'What Testers cannot do',
        items: [
          'Create, edit, or delete Controls, Requests, or Tests.',
          'Assign Tests to others.',
          'Delete or edit comments.',
          'Change Test priority, due date, or other core fields (only Managers can).',
          'View tests assigned to other Testers.',
          'Create or edit Requests.',
          'Access admin-only features or settings.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'Role restrictions are enforced at the system and database level. If you see a disabled button or "Manager only" message, that action requires Manager permissions.',
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'If you need temporary Manager access (e.g., to create a Test for a colleague), ask your system admin or manager to grant it. Your role is managed via Cognito groups, and changes take effect after you log out and log back in.',
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Do not share your login credentials. If a Tester needs to do Manager work, they should request a role change from an admin, not borrow an account.',
      },
    ],
  },
  {
    id: 'calendar-and-view-modes',
    title: 'Using Calendar, Kanban, and Tracker Views',
    categoryId: 'testing',
    order: 35,
    summary: 'Learn how to choose the right view (Calendar, Kanban, Tracker) for your task.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_TESTS],
    keywords: [
      'calendar',
      'kanban',
      'tracker',
      'view',
      'mode',
      'filter',
      'due date',
      'workflow',
      'status',
    ],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/calendar-kanban-tracker.mp4',
      poster: '/help-assets/calendar-kanban-tracker-poster.png',
      title: 'Calendar, Kanban, and Tracker views walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'V-CAT offers three different views to help you work with Tests: Tracker (table/list), Kanban (workflow columns), and Calendar (due date timeline). Each view is optimized for different tasks. Choose the right view to work efficiently.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Tracker view (table list)',
        items: [
          'Best for: Filtering, sorting, bulk operations (bulk assign, bulk export), and detailed review.',
          'What you see: Tests in a table with columns for Control, Request, Status, Priority, Due Date, Assigned Tester, and more.',
          'How to use: Use filters (Status, Priority, Request, Tester, Due Date range) to focus on what you care about. Sort by any column (click column header). Select multiple rows with checkboxes for bulk actions.',
          'Pagination: Scroll down to see more records or use pagination buttons to navigate pages.',
          'Common tasks: "Show me all In Progress tests," "Export all High priority tests," "Bulk assign tests to John."',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Kanban view (workflow columns)',
        items: [
          'Best for: Understanding workflow progress and visually moving Tests through stages.',
          'What you see: Tests displayed as cards grouped into columns by status (Unassigned, Assigned, In Progress, DAT Passed, OET Passed, Complete, Blocked).',
          'How to use: Drag and drop cards to move Tests between statuses. Click a card to open details and add comments or evidence.',
          'Filter options: Filter by Priority, Tester, Request, or Due Date to reduce clutter.',
          'Common tasks: "Move this Test to In Progress," "See all Blocked tests," "Quick progress check across all statuses."',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Calendar view (due date timeline)',
        items: [
          'Best for: Planning and understanding due dates. Spot overdue and upcoming Tests at a glance.',
          'What you see: Tests displayed on a calendar grid. Each day shows Tests due on that date, color-coded by status (Completed = green, In Progress = blue, Overdue = red, etc.).',
          'How to use: Click a date to see Tests due that day. Hover over a Test card to see details. Use month/week/day view toggles to zoom in/out.',
          'Filter options: Filter by Priority, Tester, or Request.',
          'Common tasks: "What is due this week?" "Are there any overdue Tests?" "What is my Tester workload for next month?"',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Common filter and sort operations',
        items: [
          'Filter by Status: "Show me only In Progress and Blocked tests" (Kanban is best for this).',
          'Filter by Due Date: "Show me tests due in the next 7 days" (Calendar is best for this).',
          'Filter by Priority: "Show me all High priority tests" (Tracker or Kanban).',
          'Filter by Tester: "Show me tests assigned to Sarah" (All views).',
          'Filter by Request: "Show me all tests in Request 2024-Q1-Audit" (All views).',
          'Sort by Due Date: "Show me overdue tests first" (Tracker).',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Tips for each role',
        items: [
          'Managers: Use Tracker for bulk operations and reporting. Use Kanban for quick status checks. Use Calendar for workload planning and spotting bottlenecks.',
          'Testers: Use Tracker to see all your assigned Tests and filter to "In Progress" or "Blocked" to prioritize. Use Kanban to move Tests through the workflow. Use Calendar to avoid missing due dates.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Switch between views depending on your current task. There is no single "best" view—use the right view for the right job.',
      },
    ],
  },
  {
    id: 'evidence-and-attachments',
    title: 'Evidence & Attachments Guide',
    categoryId: 'testing',
    order: 45,
    summary:
      'Learn how to attach evidence, supporting documents, and file types for your test findings.',
    roles: [ROLES.TESTER, ROLES.MANAGER],
    permissions: [ACTIONS.UPDATE_TEST, ACTIONS.COMMENT],
    keywords: [
      'evidence',
      'attachment',
      'file',
      'document',
      'link',
      'upload',
      'screenshot',
      'proof',
    ],
    media: null,
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'Evidence supports your test findings and provides proof that you performed the testing. Good evidence is clear, organized, and directly linked to the control being tested. This guide explains how to attach evidence in V-CAT.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'How to attach evidence',
        items: [
          'Open a Test and scroll to the "Attachments" or "Evidence" section in the test details modal.',
          'Click "Add Attachment" or "Attach Evidence."',
          'Choose how you want to attach:',
          '  - Upload a file from your computer (PDF, Excel, Word, screenshot, etc.).',
          '  - Paste or link to an external document (e.g., Google Drive, SharePoint, S3 link).',
          '  - Add a comment that references evidence stored elsewhere.',
          'For uploads: Select the file and click "Confirm." The file will be stored in V-CAT.',
          'For links: Paste the full URL (e.g., https://drive.google.com/file/d/123abc) and click "Add."',
          'Verify the attachment appears in the list and is accessible.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Supported file types',
        items: [
          'Documents: PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx).',
          'Images: PNG, JPG, GIF (useful for screenshots).',
          'Logs & data: CSV, TXT, JSON.',
          'Other: Any file type can be uploaded, but large files (>100 MB) may be rejected. Contact your admin if you need to attach large files.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Best practices for evidence',
        items: [
          'Be specific: Label each attachment with what it shows (e.g., "2024-04-15-Access-Log.xlsx" instead of "Log.xlsx").',
          'Reference attachments in comments: "See attached screenshot for evidence of successful login" so your Manager knows what to look at.',
          'Include context: If the evidence is complex, add a brief comment explaining what it demonstrates and how it relates to the control.',
          'Keep it organized: If you have multiple evidence files for one test, group them logically and reference them in order.',
          'Archive externally: Keep copies of all evidence outside V-CAT for your own records (compliance may require auditable proof).',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'External links best practices',
        items: [
          'Use permanent, shareable links: Ensure the link will not expire or become inaccessible.',
          'Set permissions: Verify your Manager can view the link (e.g., no password-protected folders).',
          'Test the link: Verify the link works before adding it.',
          'Use descriptive link text: Instead of "https://drive.google.com/file/d/...", label it "Access Control Audit - March 2024".',
          'Note link expiration: If the link has an expiration date, mention it in a comment so your Manager acts promptly.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Managing attachments',
        items: [
          'To view an attachment: Click the attachment name or link to open it in a new tab.',
          'To remove an attachment: Click the "X" or "Delete" button next to the attachment (only you or your Manager can delete).',
          'To re-upload: Delete the old attachment and add a new one with the corrected version.',
          'Download for backup: Many files can be downloaded by right-clicking the link and selecting "Save As."',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Attach evidence as you test, not all at the end. This spreads the work across testing phases and ensures you do not lose files or forget what you discovered.',
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Do not attach sensitive data (passwords, API keys, personally identifiable information). If you must reference something sensitive, create a redacted version or describe it generically in a comment.',
      },
    ],
  },
  {
    id: 'test-status-definitions',
    title: 'Test Status Definitions & Workflow Transitions',
    categoryId: 'testing',
    order: 50,
    summary: 'Understand each test status, what it means, and which transitions are allowed.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.UPDATE_TEST],
    keywords: [
      'status',
      'workflow',
      'state',
      'transition',
      'unassigned',
      'assigned',
      'in progress',
      'complete',
      'blocked',
      'passed',
      'failed',
    ],
    media: null,
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'Each Test moves through a lifecycle as you plan, assign, execute, and complete testing work. Understanding the status flow helps you track progress, spot bottlenecks, and know what action to take next.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Test statuses explained',
        items: [
          'Unassigned: The Test has been created but no Tester has been assigned yet. Only Managers can move Tests out of this status by assigning them.',
          'Assigned: The Test is assigned to a Tester but they have not started work yet. The Tester should review the control and begin testing.',
          'In Progress: The Tester has started executing the test. They may still be gathering evidence, running procedures, or documenting findings.',
          'DAT Passed: The Tester completed Design and Operational Effectiveness Testing and verified the control is well-designed. Only applicable if Test Type includes DAT.',
          'DAT Failed: The Tester completed Design testing and found the control has design gaps or weaknesses.',
          'OET Passed: The Tester completed Operational Effectiveness Testing and verified the control is operating effectively.',
          'OET Failed: The Tester completed Operational testing and found the control is not operating as designed.',
          'Complete: All required test work is done (DAT and/or OET, passed or failed). The Test is ready for Manager review and closure.',
          'Blocked: The Tester cannot proceed (e.g., missing access, unclear requirements, awaiting external input). Work is paused until the Manager unblocks it.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Valid status transitions',
        items: [
          'Unassigned → Assigned (Manager only): Assign the Test to a Tester.',
          'Assigned → In Progress (Tester): Start executing the test.',
          'In Progress → DAT Passed / DAT Failed / OET Passed / OET Failed (Tester): Record your test result.',
          'In Progress → Blocked (Tester): Pause and wait for Manager to unblock.',
          'Blocked → Assigned or In Progress (Manager): Unblock by removing the blocker. Tester resumes work.',
          'DAT Passed / OET Passed → Complete (Tester or Manager): Mark final completion.',
          'DAT Failed / OET Failed → Complete (Tester or Manager): Mark final completion (even though test failed, work is done).',
          'Any status → Blocked (Tester): Can block at any time if work is stuck.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Invalid or restricted transitions',
        items: [
          'Unassigned cannot go directly to In Progress, DAT Passed, Complete, etc. Must be Assigned first.',
          'Cannot skip steps: If Test Type = "Both" (DAT + OET), you cannot go directly from "In Progress" to "OET Passed" without first recording DAT result.',
          'Complete cannot transition back to earlier statuses (no reverting once complete). Only Managers can "undo" a completion; contact your Manager if needed.',
          'Managers approve certain transitions: Some workflows may require Manager sign-off on state changes. The UI will show "Pending Manager Approval" if applicable.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Understanding test type and status flow',
        items: [
          'Test Type = "DAT only": Flow is Unassigned → Assigned → In Progress → DAT Passed/Failed → Complete.',
          'Test Type = "OET only": Flow is Unassigned → Assigned → In Progress → OET Passed/Failed → Complete.',
          'Test Type = "Both": Flow is Unassigned → Assigned → In Progress → DAT Passed/Failed → (continue testing) → OET Passed/Failed → Complete. You must record both DAT and OET results.',
          'If DAT fails and you are testing "Both" types: You may still proceed to OET to document operational behavior, even though design is flawed.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Common status scenarios',
        items: [
          'Scenario: "I finished the test but the status changed back to Assigned." → This may happen if the system detected an incomplete field. Check for required comments, attachments, or Manager approval. Update missing fields and change status again.',
          'Scenario: "Why can\'t I move the status?" → Verify you have the required permissions (only Testers can update their assigned Tests; only Managers can change Unassigned tests). Check if the transition is valid for your Test Type.',
          'Scenario: "The status is Blocked and I cannot change it." → Only the Manager who blocked it (or another Manager) can unblock it. Contact your Manager and explain what was blocking you.',
          'Scenario: "I marked it Complete but my Manager asked me to update it again." → Managers can reopen completed Tests if more work is needed. The status will revert to a prior state; make the requested updates and re-mark as Complete.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Always add a comment before changing status, especially for "Failed" or "Blocked" outcomes. This helps your Manager understand your decision and take next steps.',
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Verify you have the correct Test Type (DAT, OET, or Both) before starting. If the Test Type is wrong, contact your Manager to correct it before you mark results as Passed or Failed.',
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
