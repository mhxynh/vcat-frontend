export const controlsData = [
  {
    id: 1,
    control: 'Access Control Review',
    tester: 'John Smith',
    testType: 'DAT & OET',
    status: 'OET In Progress',
    statusType: 'primary', // maps to blue
    step: 'Addressing Comments',
    dateUpdated: 'Jan 14, 2026',
    dueDate: 'Jan 28, 2026',
    etaDate: 'Jan 18, 2026',
  },
  {
    id: 2,
    control: 'Password Policy Validation',
    tester: 'Sarah Johnson',
    testType: 'DAT & OET',
    status: 'Completed',
    statusType: 'success', // maps to green
    step: 'Complete',
    dateUpdated: 'Jan 13, 2026',
    dueDate: 'Jan 15, 2026',
    etaDate: 'Jan 15, 2026',
  },
  {
    id: 3,
    control: 'Encryption Standards Check',
    tester: 'Michael Chen',
    testType: 'DAT Only',
    status: 'Not Started',
    statusType: 'default', // maps to gray
    step: 'Not Started',
    dateUpdated: 'Jan 9, 2026',
    dueDate: 'Jan 22, 2026',
    etaDate: 'Jan 15, 2026',
  },
  {
    id: 4,
    control: 'Backup & Recovery Testing',
    tester: 'David Wilson',
    testType: 'DAT & OET',
    status: 'In Review',
    statusType: 'warning', // maps to yellow
    step: 'Complete',
    dateUpdated: 'Jan 12, 2026',
    dueDate: 'Jan 12, 2026',
    etaDate: 'Jan 12, 2026',
  },
  {
    id: 5,
    control: 'Incident Response Plan',
    tester: 'Lisa Anderson',
    testType: 'DAT Only',
    status: 'Blocked',
    statusType: 'danger', // maps to red
    step: 'Testing Blocked',
    dateUpdated: 'Jan 16, 2026',
    dueDate: 'Jan 21, 2026',
    etaDate: 'Jan 21, 2026',
  },
];
