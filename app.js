/**
 * ==============================================================================
 * Student Performance Analyzer - Teacher Curriculum & Passmarks Engine
 * ==============================================================================
 * Key capabilities:
 * - Teachers define custom Subject Names (e.g. Subject 1 = Maths), Full Marks (e.g. 100),
 *   and Pass Marks (e.g. 36) for up to 20 subjects.
 * - Dynamic student calculation engine: Total Marks, Percentage, Grade, Rank, and
 *   strict per-subject Pass/Fail tracking.
 * - Dynamic Subject Builder with live rows, quick count selectors, and presets.
 * - Dynamic Table, dynamic Report Cards, and Chart.js visualizations.
 * ==============================================================================
 */

// --- Global Constants & Storage Keys ---
const MAX_SUBJECTS_LIMIT = 20;
const STORAGE_KEY_SUBJECTS = 'student_performance_analyzer_subjects_v3';
const STORAGE_KEY_STUDENTS = 'student_performance_analyzer_students_v3';

// --- State Variables ---
let subjects = [];
let students = [];
let sortColumn = 'rank';
let sortDirection = 'asc';

// Chart.js instances
let gradeChartInstance = null;
let subjectChartInstance = null;

// --- Default Curriculum: Subject 1=Maths (100/36), Subject 2=Science (100/36) etc. ---
const DEFAULT_PRESET_36 = [
  { id: 'subj_1', name: 'Maths', fullMarks: 100, passMarks: 36 },
  { id: 'subj_2', name: 'Science', fullMarks: 100, passMarks: 36 },
  { id: 'subj_3', name: 'English', fullMarks: 100, passMarks: 36 },
  { id: 'subj_4', name: 'Social Studies', fullMarks: 100, passMarks: 36 },
  { id: 'subj_5', name: 'Computer Science', fullMarks: 100, passMarks: 36 }
];

const DEFAULT_DEMO_STUDENTS = [
  {
    id: 's-101',
    name: 'Eleanor Vance',
    rollNo: 'S-101',
    marks: { subj_1: 95, subj_2: 92, subj_3: 88, subj_4: 90, subj_5: 98 }
  },
  {
    id: 's-102',
    name: 'Marcus Holloway',
    rollNo: 'S-102',
    marks: { subj_1: 82, subj_2: 78, subj_3: 84, subj_4: 76, subj_5: 92 }
  },
  {
    id: 's-103',
    name: 'Chloe Price',
    rollNo: 'S-103',
    marks: { subj_1: 65, subj_2: 72, subj_3: 80, subj_4: 85, subj_5: 74 }
  },
  {
    id: 's-104',
    name: 'Lucas Baker',
    rollNo: 'S-104',
    marks: { subj_1: 54, subj_2: 48, subj_3: 60, subj_4: 58, subj_5: 64 }
  },
  {
    id: 's-105',
    name: 'Aisha Khan',
    rollNo: 'S-105',
    marks: { subj_1: 38, subj_2: 42, subj_3: 50, subj_4: 45, subj_5: 52 }
  },
  {
    id: 's-106',
    name: 'Daniel Diaz',
    rollNo: 'S-106',
    // Daniel scored 32 in Maths (< 36), demonstrating automatic failure in 1 subject despite high marks in other subjects!
    marks: { subj_1: 32, subj_2: 85, subj_3: 88, subj_4: 90, subj_5: 92 }
  }
];

// ==============================================================================
// 1. Academic Calculations & Metrics
// ==============================================================================

/**
 * Returns sum of full marks across all active subjects.
 */
function getTotalFullMarks() {
  return subjects.reduce((sum, subj) => sum + (Number(subj.fullMarks) || 0), 0);
}

/**
 * Calculates sum of student's scores across active subjects.
 */
function calculateTotalMarks(studentMarks) {
  return subjects.reduce((sum, subj) => {
    const val = Number(studentMarks[subj.id]) || 0;
    return sum + val;
  }, 0);
}

/**
 * Calculates academic percentage to 2 decimal places.
 */
function calculatePercentage(totalMarks, totalFullMarks) {
  if (totalFullMarks <= 0) return 0;
  return Number(((totalMarks / totalFullMarks) * 100).toFixed(2));
}

/**
 * Standard letter grade based on percentage.
 */
/**
 * Letter grade calculation:
 * - If a student failed in even 1 subject, their grade is automatically 'F' (Fail).
 * - If a student passed EVERY subject (marks >= pass mark in all subjects), grade is awarded by percentage.
 */
function calculateGrade(percentage, isPass = true) {
  if (!isPass) return 'F';
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'D'; // Passed all subjects with valid passmarks
}

/**
 * Identifies which specific subjects a student failed (score < passMarks, e.g. < 36).
 */
function getFailedSubjectsForStudent(studentMarks) {
  return subjects.filter(subj => {
    const score = Number(studentMarks[subj.id]) || 0;
    const reqPass = Number(subj.passMarks) || 36;
    return score < reqPass;
  });
}

/**
 * Refreshes calculations for all students and assigns class ranks.
 * Strict Rule:
 * - Student gets marks >= passMarks (e.g. 36) in EVERY subject -> PASS.
 * - Student gets less than 36 in even 1 subject -> AUTOMATICALLY FAILED.
 */
function refreshStudentCalculations() {
  const totalFullMarks = getTotalFullMarks();

  students.forEach(student => {
    student.totalMarks = calculateTotalMarks(student.marks);
    student.totalFullMarks = totalFullMarks;
    student.percentage = calculatePercentage(student.totalMarks, totalFullMarks);

    const failedSubjs = getFailedSubjectsForStudent(student.marks);
    student.failedSubjects = failedSubjs.map(s => s.name);
    student.failedSubjectDetails = failedSubjs.map(s => ({
      name: s.name,
      score: Number(student.marks[s.id]) || 0,
      passMarks: s.passMarks
    }));

    // If 0 failed subjects -> PASS. If 1 or more failed subjects -> AUTOMATICALLY FAIL.
    student.isPass = (failedSubjs.length === 0);
    student.status = student.isPass ? 'Pass' : 'Fail';
    student.grade = calculateGrade(student.percentage, student.isPass);
  });

  // Sort descending by percentage for rank assignment
  const sortedCopy = [...students].sort((a, b) => b.percentage - a.percentage);

  let currentRank = 1;
  sortedCopy.forEach((sortedSt, index) => {
    if (index > 0 && sortedSt.percentage < sortedCopy[index - 1].percentage) {
      currentRank = index + 1;
    }
    const match = students.find(s => s.id === sortedSt.id);
    if (match) match.rank = currentRank;
  });
}

// ==============================================================================
// 2. LocalStorage Persistence
// ==============================================================================

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(subjects));
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  } catch (err) {
    console.warn('Storage save failed:', err);
  }
}

function loadFromStorage() {
  try {
    const storedSubjs = localStorage.getItem(STORAGE_KEY_SUBJECTS);
    const storedSts = localStorage.getItem(STORAGE_KEY_STUDENTS);

    if (storedSubjs) {
      subjects = JSON.parse(storedSubjs);
    } else {
      subjects = JSON.parse(JSON.stringify(DEFAULT_PRESET_36));
    }

    if (storedSts) {
      students = JSON.parse(storedSts);
    } else {
      students = JSON.parse(JSON.stringify(DEFAULT_DEMO_STUDENTS));
    }
  } catch (err) {
    console.error('Storage load error:', err);
    subjects = JSON.parse(JSON.stringify(DEFAULT_PRESET_36));
    students = [];
  }

  refreshStudentCalculations();
}

// ==============================================================================
// 3. Teacher's Subject Builder (Up to 20 Subjects with Full & Pass Marks)
// ==============================================================================

const subjectConfigModal = document.getElementById('subjectConfigModal');
const subjectBuilderForm = document.getElementById('subjectBuilderForm');
const subjectRowsContainer = document.getElementById('subjectRowsContainer');
const subjectCountBadge = document.getElementById('subjectCountBadge');
const headerSubjectCount = document.getElementById('headerSubjectCount');
const curriculumSummaryPills = document.getElementById('curriculumSummaryPills');

/**
 * Opens Subject Builder modal.
 */
function openSubjectConfigModal() {
  renderSubjectBuilderRows();
  subjectConfigModal.classList.add('active');
}

/**
 * Closes Subject Builder modal without saving uncommitted changes.
 */
function closeSubjectConfigModal() {
  subjectConfigModal.classList.remove('active');
}

/**
 * Renders the editable rows inside the Subject Builder Modal.
 */
function renderSubjectBuilderRows() {
  const count = subjects.length;
  subjectCountBadge.textContent = `${count} / ${MAX_SUBJECTS_LIMIT} Subjects`;
  headerSubjectCount.textContent = count;

  // Toggle Add Row button status
  const btnAdd = document.getElementById('btnAddSubjectRow');
  if (btnAdd) {
    btnAdd.disabled = count >= MAX_SUBJECTS_LIMIT;
    btnAdd.title = count >= MAX_SUBJECTS_LIMIT ? 'Limit of 20 subjects reached' : 'Add another subject row';
  }

  if (count === 0) {
    subjectRowsContainer.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 24px;">
        No subjects configured. Click "➕ Add Subject Row" or choose a quick preset above.
      </div>
    `;
    updateSubjectBuilderSummary();
    return;
  }

  subjectRowsContainer.innerHTML = subjects.map((subj, index) => `
    <div class="subject-builder-row" data-id="${subj.id}">
      <div class="subj-number-badge">Subject ${index + 1}</div>
      <div>
        <input 
          type="text" 
          class="builder-subj-name" 
          value="${escapeHtml(subj.name)}" 
          placeholder="e.g. Maths, Science" 
          maxlength="30" 
          required
          title="Subject Name"
        >
      </div>
      <div>
        <input 
          type="number" 
          class="builder-subj-full" 
          value="${subj.fullMarks}" 
          min="10" 
          max="1000" 
          placeholder="Full Marks" 
          required
          title="Full Marks (Maximum Score)"
          oninput="handleFullMarksChange(this)"
        >
      </div>
      <div>
        <input 
          type="number" 
          class="builder-subj-pass" 
          value="${subj.passMarks}" 
          min="1" 
          max="1000" 
          placeholder="Pass Mark" 
          required
          title="Minimum marks needed to pass"
        >
      </div>
      <div>
        <button 
          type="button" 
          class="btn btn-danger-outline btn-sm" 
          onclick="removeSubjectRow('${subj.id}')" 
          title="Delete this subject row"
        >
          🗑️
        </button>
      </div>
    </div>
  `).join('');

  updateSubjectBuilderSummary();
}

/**
 * Updates summary calculations inside the subject builder modal.
 */
function updateSubjectBuilderSummary() {
  const count = subjects.length;
  const totalFull = subjects.reduce((sum, s) => sum + (Number(s.fullMarks) || 0), 0);
  const totalPass = subjects.reduce((sum, s) => sum + (Number(s.passMarks) || 0), 0);

  document.getElementById('summarySubjCount').textContent = count;
  document.getElementById('summaryFullMarks').textContent = totalFull;
  document.getElementById('summaryPassMarks').textContent = totalPass;
}

/**
 * When teacher changes full marks, auto-suggests a 36% or 40% pass mark if reasonable.
 */
function handleFullMarksChange(inputElement) {
  const row = inputElement.closest('.subject-builder-row');
  if (!row) return;
  const passInput = row.querySelector('.builder-subj-pass');
  const fullVal = Number(inputElement.value) || 0;
  if (fullVal > 0 && passInput) {
    // If full is 100, default passmark is 36
    if (fullVal === 100) {
      passInput.value = 36;
    } else {
      passInput.value = Math.ceil(fullVal * 0.36);
    }
  }
  updateSubjectBuilderSummary();
}

/**
 * Adds a new subject row (e.g. Subject 6).
 */
document.getElementById('btnAddSubjectRow').addEventListener('click', () => {
  if (subjects.length >= MAX_SUBJECTS_LIMIT) {
    alert(`Maximum of ${MAX_SUBJECTS_LIMIT} subjects reached.`);
    return;
  }

  // Read current row inputs first to not lose in-progress edits
  syncSubjectsFromBuilderRows();

  const nextNumber = subjects.length + 1;
  const defaultNames = ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Economics', 'Computer Science', 'Art'];
  const suggestedName = defaultNames[nextNumber - 1] || `Subject ${nextNumber}`;

  subjects.push({
    id: 'subj_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: suggestedName,
    fullMarks: 100,
    passMarks: 36
  });

  renderSubjectBuilderRows();
});

/**
 * Deletes a subject row.
 */
function removeSubjectRow(id) {
  syncSubjectsFromBuilderRows();
  subjects = subjects.filter(s => s.id !== id);
  renderSubjectBuilderRows();
}

/**
 * Quick sets the number of subjects directly (e.g. 5 subjects, 8 subjects, up to 20).
 */
function quickSetSubjectCount(targetCount) {
  if (targetCount < 1 || targetCount > MAX_SUBJECTS_LIMIT) return;

  const defaultSubjectNames = [
    'Maths', 'Science', 'English', 'Social Studies', 'Computer Science',
    'Physics', 'Chemistry', 'Biology', 'History', 'Geography',
    'Economics', 'Accountancy', 'Business Studies', 'Environmental Science', 'Moral Science',
    'Physical Education', 'Art & Craft', 'General Knowledge', 'Music', 'French'
  ];

  const newSubjects = [];
  for (let i = 0; i < targetCount; i++) {
    // Preserve existing subject name and marks if already present
    if (subjects[i]) {
      newSubjects.push(subjects[i]);
    } else {
      newSubjects.push({
        id: 'subj_' + Date.now() + '_' + i,
        name: defaultSubjectNames[i] || `Subject ${i + 1}`,
        fullMarks: 100,
        passMarks: 36
      });
    }
  }

  subjects = newSubjects;
  renderSubjectBuilderRows();
}

/**
 * Applies predefined subject curriculum configurations.
 */
function applyPreset(presetType) {
  if (presetType === 'standard_36') {
    subjects = [
      { id: 'subj_1', name: 'Maths', fullMarks: 100, passMarks: 36 },
      { id: 'subj_2', name: 'Science', fullMarks: 100, passMarks: 36 },
      { id: 'subj_3', name: 'English', fullMarks: 100, passMarks: 36 },
      { id: 'subj_4', name: 'Social Studies', fullMarks: 100, passMarks: 36 },
      { id: 'subj_5', name: 'Computer Science', fullMarks: 100, passMarks: 36 }
    ];
  } else if (presetType === 'standard_40') {
    subjects = [
      { id: 'subj_1', name: 'Maths', fullMarks: 100, passMarks: 40 },
      { id: 'subj_2', name: 'Science', fullMarks: 100, passMarks: 40 },
      { id: 'subj_3', name: 'English', fullMarks: 100, passMarks: 40 },
      { id: 'subj_4', name: 'Social Studies', fullMarks: 100, passMarks: 40 },
      { id: 'subj_5', name: 'Computer Science', fullMarks: 100, passMarks: 40 }
    ];
  } else if (presetType === 'science_split') {
    subjects = [
      { id: 'subj_1', name: 'Physics (Theory)', fullMarks: 75, passMarks: 27 },
      { id: 'subj_2', name: 'Physics (Practical)', fullMarks: 25, passMarks: 9 },
      { id: 'subj_3', name: 'Chemistry (Theory)', fullMarks: 75, passMarks: 27 },
      { id: 'subj_4', name: 'Chemistry (Practical)', fullMarks: 25, passMarks: 9 },
      { id: 'subj_5', name: 'Maths', fullMarks: 100, passMarks: 36 },
      { id: 'subj_6', name: 'English', fullMarks: 100, passMarks: 36 }
    ];
  } else if (presetType === 'college_mixed') {
    subjects = [
      { id: 'subj_1', name: 'Data Structures', fullMarks: 100, passMarks: 40 },
      { id: 'subj_2', name: 'Algorithms Lab', fullMarks: 50, passMarks: 20 },
      { id: 'subj_3', name: 'Discrete Maths', fullMarks: 100, passMarks: 40 },
      { id: 'subj_4', name: 'Computer Networks', fullMarks: 75, passMarks: 30 },
      { id: 'subj_5', name: 'Networks Lab', fullMarks: 25, passMarks: 10 },
      { id: 'subj_6', name: 'Software Eng.', fullMarks: 100, passMarks: 40 },
      { id: 'subj_7', name: 'Database Systems', fullMarks: 75, passMarks: 30 },
      { id: 'subj_8', name: 'Seminar & Viva', fullMarks: 50, passMarks: 25 }
    ];
  }

  renderSubjectBuilderRows();
}

/**
 * Synchronizes in-memory `subjects` array with values currently entered in builder row inputs.
 */
function syncSubjectsFromBuilderRows() {
  const rows = subjectRowsContainer.querySelectorAll('.subject-builder-row');
  const updated = [];

  rows.forEach((row, index) => {
    const id = row.getAttribute('data-id');
    const nameInput = row.querySelector('.builder-subj-name');
    const fullInput = row.querySelector('.builder-subj-full');
    const passInput = row.querySelector('.builder-subj-pass');

    const name = nameInput ? nameInput.value.trim() : `Subject ${index + 1}`;
    const fullMarks = fullInput ? Number(fullInput.value) || 100 : 100;
    const passMarks = passInput ? Number(passInput.value) || 36 : 36;

    updated.push({
      id,
      name: name || `Subject ${index + 1}`,
      fullMarks,
      passMarks
    });
  });

  subjects = updated;
}

/**
 * Handles Form Submission for Subject Builder: Saves and applies to entire app.
 */
subjectBuilderForm.addEventListener('submit', (e) => {
  e.preventDefault();

  syncSubjectsFromBuilderRows();

  if (subjects.length === 0) {
    alert('Please configure at least 1 subject.');
    return;
  }

  // Validate inputs
  for (const subj of subjects) {
    if (!subj.name) {
      alert('All subjects must have a valid name.');
      return;
    }
    if (subj.fullMarks <= 0) {
      alert(`Full marks for "${subj.name}" must be greater than 0.`);
      return;
    }
    if (subj.passMarks <= 0 || subj.passMarks > subj.fullMarks) {
      alert(`Pass mark for "${subj.name}" (${subj.passMarks}) must be between 1 and ${subj.fullMarks}.`);
      return;
    }
  }

  // Re-run calculations and re-render everything
  refreshStudentCalculations();
  saveToStorage();
  updateCurriculumUI();
  renderKPIs();
  renderTable();
  renderCharts();
  closeSubjectConfigModal();
});

// ==============================================================================
// 4. UI Rendering: Curriculum Banner, KPIs, Table, Charts
// ==============================================================================

/**
 * Updates curriculum pills in the top banner and KPI counters.
 */
function updateCurriculumUI() {
  const count = subjects.length;
  const totalMax = getTotalFullMarks();

  headerSubjectCount.textContent = count;
  document.getElementById('kpiCurriculumSummary').textContent = `${count} Subj / ${totalMax} Full`;

  // Render pills in overview banner
  curriculumSummaryPills.innerHTML = subjects.map((subj, i) => `
    <div class="curriculum-pill" title="Subject ${i + 1}: ${escapeHtml(subj.name)} (Full: ${subj.fullMarks}, Pass: ${subj.passMarks})">
      <strong>S${i + 1}: ${escapeHtml(subj.name)}</strong>
      <span>(${subj.fullMarks}/${subj.passMarks})</span>
    </div>
  `).join('');
}

/**
 * Renders Top KPI Summary cards.
 */
function renderKPIs() {
  const totalCount = students.length;
  const kpiTotalStudents = document.getElementById('kpiTotalStudents');
  const kpiClassAverage = document.getElementById('kpiClassAverage');
  const kpiTopPerformer = document.getElementById('kpiTopPerformer');
  const kpiPassingRate = document.getElementById('kpiPassingRate');

  updateCurriculumUI();

  if (totalCount === 0) {
    kpiTotalStudents.textContent = '0';
    kpiClassAverage.textContent = '0%';
    kpiTopPerformer.textContent = 'None';
    kpiPassingRate.textContent = '0%';
    return;
  }

  kpiTotalStudents.textContent = totalCount;

  // Class Average Percentage
  const sumPercentage = students.reduce((acc, s) => acc + s.percentage, 0);
  const classAvg = (sumPercentage / totalCount).toFixed(1);
  kpiClassAverage.textContent = `${classAvg}%`;

  // Top Performer
  const rank1Student = students.reduce((top, current) => 
    (current.percentage > (top?.percentage || -1)) ? current : top, null);
  
  kpiTopPerformer.textContent = rank1Student 
    ? `${rank1Student.name} (${rank1Student.percentage}%)` 
    : 'None';

  // Passing Rate (Students who cleared both percentage and all pass marks)
  const passedCount = students.filter(s => s.status === 'Pass').length;
  const passRate = ((passedCount / totalCount) * 100).toFixed(1);
  kpiPassingRate.textContent = `${passRate}%`;
}

/**
 * Dynamically builds Table Header showing Subject Names, Fullmarks and Passmarks.
 */
function renderTableHeader() {
  const thead = document.getElementById('studentTableHead');
  const totalFullMarks = getTotalFullMarks();

  const subjectThs = subjects.map((subj, index) => `
    <th>
      <div>S${index + 1}: ${escapeHtml(subj.name)}</div>
      <span class="th-sub">Full: ${subj.fullMarks} | Pass: ${subj.passMarks}</span>
    </th>
  `).join('');

  thead.innerHTML = `
    <tr>
      <th data-sort="rank">Rank ⬍</th>
      <th data-sort="rollNo">Roll No ⬍</th>
      <th data-sort="name">Student Name ⬍</th>
      ${subjectThs}
      <th data-sort="totalMarks">Total (/${totalFullMarks}) ⬍</th>
      <th data-sort="percentage">Percentage ⬍</th>
      <th>Grade</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  `;

  // Attach column sort listeners
  thead.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.getAttribute('data-sort');
      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = column === 'name' || column === 'rollNo' ? 'asc' : 'desc';
      }
      renderTable();
    });
  });
}

/**
 * Renders Data Table with highlighted pass/fail scores per subject.
 */
function renderTable() {
  renderTableHeader();

  const tbody = document.getElementById('studentTableBody');
  const emptyState = document.getElementById('emptyState');
  const recordCountBadge = document.getElementById('recordCountBadge');
  const searchVal = document.getElementById('searchInput').value.trim().toLowerCase();
  const filterGrade = document.getElementById('gradeFilter').value;
  const filterStatus = document.getElementById('statusFilter').value;
  const totalFullMarks = getTotalFullMarks();

  // Filter students
  let filtered = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchVal) ||
                          student.rollNo.toLowerCase().includes(searchVal);
    const matchesGrade = (filterGrade === 'ALL') || (student.grade === filterGrade);
    const matchesStatus = (filterStatus === 'ALL') || (student.status === filterStatus);
    return matchesSearch && matchesGrade && matchesStatus;
  });

  // Sort students
  filtered.sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    if (sortColumn === 'name' || sortColumn === 'rollNo') {
      return sortDirection === 'asc' 
        ? String(aVal).localeCompare(String(bVal)) 
        : String(bVal).localeCompare(String(aVal));
    }

    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  recordCountBadge.textContent = `${filtered.length} of ${students.length} Students`;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  // Build rows
  tbody.innerHTML = filtered.map(student => {
    const isPassed = student.status === 'Pass';
    const statusClass = isPassed ? 'status-pass' : 'status-fail';
    const statusIcon = isPassed ? '✓' : '✗';

    // Status label specifies failed subjects if applicable
    let statusLabel = isPassed ? 'Pass (Cleared all subjects >= 36)' : `Automatic Fail: Scored < pass mark in ${student.failedSubjects.join(', ')}`;
    let statusText = isPassed 
      ? '✓ PASS' 
      : `✗ FAIL (${student.failedSubjects.length === 1 ? student.failedSubjects[0] : `${student.failedSubjects.length} Subj`})`;

    // Build subject score cells (highlight if below that subject's pass mark)
    const subjectTds = subjects.map(subj => {
      const mark = student.marks[subj.id] !== undefined ? student.marks[subj.id] : '-';
      const isFailedInSubj = typeof mark === 'number' && mark < subj.passMarks;

      if (isFailedInSubj) {
        return `
          <td>
            <span class="mark-fail" title="Failed: Scored ${mark}, Passmark was ${subj.passMarks}">
              ${mark} ✗
            </span>
          </td>
        `;
      }
      return `<td><span class="mark-pass">${mark}</span></td>`;
    }).join('');

    return `
      <tr data-student-id="${student.id}">
        <td><span class="${getRankBadgeClass(student.rank)}">#${student.rank}</span></td>
        <td><strong>${escapeHtml(student.rollNo)}</strong></td>
        <td><div style="font-weight: 600; color: #1e293b;">${escapeHtml(student.name)}</div></td>
        ${subjectTds}
        <td><strong>${student.totalMarks}</strong> <span style="font-size: 0.75rem; color: #94a3b8;">/${totalFullMarks}</span></td>
        <td>
          <span style="font-weight: 700; color: ${isPassed ? '#047857' : '#b91c1c'};">
            ${student.percentage}%
          </span>
        </td>
        <td>
          <span class="badge-grade ${getGradeBadgeClass(student.grade)}">${student.grade}</span>
        </td>
        <td>
          <span class="status-pill ${statusClass}" title="${statusLabel}">
            ${statusText}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" onclick="viewStudentReport('${student.id}')" title="View Report Card">📄 View</button>
            <button class="btn btn-secondary btn-sm" onclick="editStudent('${student.id}')" title="Edit Student">✏️ Edit</button>
            <button class="btn btn-danger-outline btn-sm" onclick="deleteStudent('${student.id}')" title="Delete Student">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function getGradeBadgeClass(grade) {
  switch (grade) {
    case 'A+': return 'grade-aplus';
    case 'A':  return 'grade-a';
    case 'B':  return 'grade-b';
    case 'C':  return 'grade-c';
    case 'D':  return 'grade-d';
    default:   return 'grade-f';
  }
}

function getRankBadgeClass(rank) {
  if (rank === 1) return 'rank-badge rank-1';
  if (rank === 2) return 'rank-badge rank-2';
  if (rank === 3) return 'rank-badge rank-3';
  return 'rank-badge rank-other';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==============================================================================
// 5. Interactive Charts (Chart.js)
// ==============================================================================

function renderCharts() {
  renderGradeDistributionChart();
  renderSubjectAverageChart();
}

/**
 * Grade Distribution Doughnut Chart
 */
function renderGradeDistributionChart() {
  const canvas = document.getElementById('gradeDistributionChart');
  if (!canvas) return;

  const grades = ['A+', 'A', 'B', 'C', 'D', 'F'];
  const counts = grades.map(g => students.filter(s => s.grade === g).length);

  const dataConfig = {
    labels: ['Grade A+ (90%+)', 'Grade A (80-89%)', 'Grade B (70-79%)', 'Grade C (60-69%)', 'Grade D (50-59%)', 'Grade F (<50%)'],
    datasets: [{
      data: counts,
      backgroundColor: ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f97316', '#ef4444'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  if (gradeChartInstance) {
    gradeChartInstance.data = dataConfig;
    gradeChartInstance.update();
    return;
  }

  gradeChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: dataConfig,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 14, font: { family: 'Inter', size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const count = context.raw || 0;
              const total = students.length || 1;
              const percentage = ((count / total) * 100).toFixed(1);
              return ` ${context.label}: ${count} student(s) (${percentage}%)`;
            }
          }
        }
      },
      cutout: '62%'
    }
  });
}

/**
 * Subject Performance Bar Chart (Class average score % compared to full marks)
 */
function renderSubjectAverageChart() {
  const canvas = document.getElementById('subjectAverageChart');
  if (!canvas) return;

  const labels = subjects.map((s, i) => `S${i + 1}: ${s.name} (${s.fullMarks}M)`);
  
  const percentageAverages = subjects.map(subj => {
    if (students.length === 0 || subj.fullMarks <= 0) return 0;
    const totalScore = students.reduce((sum, st) => sum + (Number(st.marks[subj.id]) || 0), 0);
    const avgScore = totalScore / students.length;
    return Number(((avgScore / subj.fullMarks) * 100).toFixed(1));
  });

  const palette = [
    'rgba(79, 70, 229, 0.85)',
    'rgba(14, 165, 233, 0.85)',
    'rgba(16, 185, 129, 0.85)',
    'rgba(245, 158, 11, 0.85)',
    'rgba(139, 92, 246, 0.85)',
    'rgba(239, 68, 68, 0.85)',
    'rgba(13, 148, 136, 0.85)',
    'rgba(236, 72, 153, 0.85)'
  ];

  const colors = subjects.map((_, i) => palette[i % palette.length]);

  const dataConfig = {
    labels: labels,
    datasets: [{
      label: 'Class Average Performance (%)',
      data: percentageAverages,
      backgroundColor: colors,
      borderRadius: 6,
      borderSkipped: false
    }]
  };

  if (subjectChartInstance) {
    subjectChartInstance.data = dataConfig;
    subjectChartInstance.update();
    return;
  }

  subjectChartInstance = new Chart(canvas, {
    type: 'bar',
    data: dataConfig,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Class Average: ${ctx.raw}% of full marks`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: (v) => `${v}%`,
            font: { family: 'Inter', size: 11 }
          },
          grid: { color: '#f1f5f9' }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter', size: 10 },
            maxRotation: 45,
            minRotation: 0
          }
        }
      }
    }
  });
}

// ==============================================================================
// 6. Dynamic Student Modal (Add, Edit, Live Pass/Fail Feedback)
// ==============================================================================

const studentModal = document.getElementById('studentModal');
const studentForm = document.getElementById('studentForm');
const studentSubjectInputsContainer = document.getElementById('studentSubjectInputsContainer');
const detailModal = document.getElementById('detailModal');

/**
 * Dynamically builds input fields for each configured subject.
 */
function renderStudentFormSubjects(studentMarks = {}) {
  if (subjects.length === 0) {
    studentSubjectInputsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 16px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; color: #be123c;">
        ⚠️ No subjects configured! Click "Manage Subjects" first to set subjects, full marks, and pass marks.
      </div>
    `;
    return;
  }

  studentSubjectInputsContainer.innerHTML = subjects.map((subj, index) => {
    const currentVal = studentMarks[subj.id] !== undefined ? studentMarks[subj.id] : '';
    const isBelowPass = currentVal !== '' && Number(currentVal) < subj.passMarks;

    return `
      <div class="form-group-subject ${isBelowPass ? 'failed-threshold' : ''}" id="fg_subject_${subj.id}">
        <div class="subject-header-label">
          <span>Subject ${index + 1}: <strong>${escapeHtml(subj.name)}</strong></span>
          <div class="subject-meta-tags">
            <span class="tag-full">Full: ${subj.fullMarks}</span>
            <span class="tag-pass">Pass: ${subj.passMarks}</span>
          </div>
        </div>
        <input 
          type="number" 
          id="input_mark_${subj.id}" 
          data-subject-id="${subj.id}"
          data-full-marks="${subj.fullMarks}"
          data-pass-marks="${subj.passMarks}"
          min="0" 
          max="${subj.fullMarks}" 
          value="${currentVal}"
          placeholder="0 - ${subj.fullMarks}" 
          required
        >
        <div class="subject-live-tag" id="live_tag_${subj.id}">
          ${getLiveSubjectStatusHtml(currentVal, subj.passMarks)}
        </div>
      </div>
    `;
  }).join('');

  // Attach live calculation listener to all subject inputs
  studentSubjectInputsContainer.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', updateLiveFormPreview);
  });
}

function getLiveSubjectStatusHtml(val, passMark) {
  if (val === '') return `<span style="color: #94a3b8;">Enter marks (Min to pass: ${passMark})</span>`;
  const num = Number(val);
  if (num >= passMark) {
    return `<span class="subject-live-tag pass">✓ Passing (>= ${passMark})</span>`;
  }
  return `<span class="subject-live-tag fail">⚠️ Below Pass Mark (${passMark})</span>`;
}

/**
 * Calculates live score preview as the teacher types marks.
 */
function updateLiveFormPreview() {
  const marks = {};
  const totalFullMarks = getTotalFullMarks();
  const failedSubjects = [];

  subjects.forEach(subj => {
    const input = document.getElementById(`input_mark_${subj.id}`);
    const fg = document.getElementById(`fg_subject_${subj.id}`);
    const liveTag = document.getElementById(`live_tag_${subj.id}`);
    const valStr = input ? input.value : '';
    const val = Number(valStr) || 0;

    marks[subj.id] = Math.max(0, Math.min(subj.fullMarks, val));

    if (valStr !== '') {
      if (val < subj.passMarks) {
        failedSubjects.push(subj.name);
        if (fg) fg.classList.add('failed-threshold');
        if (liveTag) liveTag.innerHTML = `<span class="subject-live-tag fail">⚠️ Below Pass Mark (${subj.passMarks})</span>`;
      } else {
        if (fg) fg.classList.remove('failed-threshold');
        if (liveTag) liveTag.innerHTML = `<span class="subject-live-tag pass">✓ Passing (>= ${subj.passMarks})</span>`;
      }
    }
  });

  const total = calculateTotalMarks(marks);
  const percentage = calculatePercentage(total, totalFullMarks);
  const isPass = (failedSubjects.length === 0);
  const grade = calculateGrade(percentage, isPass);

  document.getElementById('previewTotal').textContent = `${total} / ${totalFullMarks}`;
  document.getElementById('previewPercentage').textContent = `${percentage}%`;

  const previewGradeEl = document.getElementById('previewGrade');
  previewGradeEl.textContent = grade;
  previewGradeEl.className = `badge-grade ${getGradeBadgeClass(grade)}`;

  const previewStatusEl = document.getElementById('previewStatus');
  if (isPass) {
    previewStatusEl.textContent = '✓ PASS (All subjects >= pass mark)';
    previewStatusEl.className = 'status-pill status-pass';
  } else {
    const reason = `AUTOMATIC FAIL: Scored < pass mark in ${failedSubjects.join(', ')}`;
    previewStatusEl.textContent = `✗ ${reason}`;
    previewStatusEl.className = 'status-pill status-fail';
  }
}

function openAddStudentModal() {
  if (subjects.length === 0) {
    alert('Please configure your subjects and passmarks first.');
    openSubjectConfigModal();
    return;
  }

  document.getElementById('modalTitle').textContent = 'Add New Student';
  document.getElementById('studentIdInput').value = '';
  studentForm.reset();
  renderStudentFormSubjects({});
  updateLiveFormPreview();
  studentModal.classList.add('active');
  document.getElementById('studentName').focus();
}

function editStudent(id) {
  const student = students.find(s => s.id === id);
  if (!student) return;

  document.getElementById('modalTitle').textContent = 'Edit Student Record';
  document.getElementById('studentIdInput').value = student.id;
  document.getElementById('studentName').value = student.name;
  document.getElementById('rollNumber').value = student.rollNo;

  renderStudentFormSubjects(student.marks);
  updateLiveFormPreview();
  studentModal.classList.add('active');
}

function closeModal() {
  studentModal.classList.remove('active');
  detailModal.classList.remove('active');
}

studentForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const idInput = document.getElementById('studentIdInput').value;
  const name = document.getElementById('studentName').value.trim();
  const rollNo = document.getElementById('rollNumber').value.trim();

  // Validate duplicate roll number
  const isDuplicate = students.some(s => s.rollNo.toLowerCase() === rollNo.toLowerCase() && s.id !== idInput);
  if (isDuplicate) {
    alert(`Roll Number "${rollNo}" is already assigned to another student. Please enter a unique Roll Number.`);
    return;
  }

  // Collect marks
  const marks = {};
  for (const subj of subjects) {
    const input = document.getElementById(`input_mark_${subj.id}`);
    if (!input) continue;
    const val = Number(input.value);

    if (isNaN(val) || val < 0 || val > subj.fullMarks) {
      alert(`Marks for "${subj.name}" must be between 0 and ${subj.fullMarks}.`);
      input.focus();
      return;
    }
    marks[subj.id] = val;
  }

  if (idInput) {
    const index = students.findIndex(s => s.id === idInput);
    if (index !== -1) {
      students[index].name = name;
      students[index].rollNo = rollNo;
      students[index].marks = marks;
    }
  } else {
    const newStudent = {
      id: 's-' + Date.now(),
      name,
      rollNo,
      marks
    };
    students.push(newStudent);
  }

  refreshStudentCalculations();
  saveToStorage();
  renderKPIs();
  renderTable();
  renderCharts();
  closeModal();
});

function deleteStudent(id) {
  const student = students.find(s => s.id === id);
  if (!student) return;

  const confirmed = confirm(`Are you sure you want to delete ${student.name} (${student.rollNo})?`);
  if (!confirmed) return;

  students = students.filter(s => s.id !== id);
  refreshStudentCalculations();
  saveToStorage();
  renderKPIs();
  renderTable();
  renderCharts();
}

/**
 * Detailed Student Report Card Generator.
 */
function viewStudentReport(id) {
  const student = students.find(s => s.id === id);
  if (!student) return;

  const container = document.getElementById('reportCardContent');
  const totalFullMarks = getTotalFullMarks();

  // Remarks generator
  let remarks = '';
  if (student.status === 'Pass') {
    if (student.percentage >= 90) {
      remarks = '🌟 Outstanding academic excellence! Cleared all subject criteria with exceptional performance.';
    } else if (student.percentage >= 80) {
      remarks = '👏 Excellent performance! Demonstrated strong competency across all subjects.';
    } else if (student.percentage >= 70) {
      remarks = '👍 Good progress! Well-balanced understanding and all subjects cleared successfully.';
    } else {
      remarks = '💡 Satisfactory achievement. Cleared all subject passing marks; revision recommended to boost higher grades.';
    }
  } else {
    if (student.failedSubjects && student.failedSubjects.length > 0) {
      remarks = `⚠️ AUTOMATIC FAIL: The student scored less than the required pass mark in ${student.failedSubjects.length} subject(s): ${student.failedSubjects.join(', ')}. Academic policy requires marks >= passing threshold in EVERY subject to pass. Scoring less than 36 in even 1 subject causes an automatic overall Fail.`;
    } else {
      remarks = '🚨 Did not achieve passing criteria. Scheduled remedial coaching advised.';
    }
  }

  // Subject rows
  const subjectRows = subjects.map((subj, index) => {
    const mark = student.marks[subj.id] !== undefined ? student.marks[subj.id] : 0;
    const isPassing = mark >= subj.passMarks;
    const percentageInSubj = subj.fullMarks > 0 ? ((mark / subj.fullMarks) * 100).toFixed(1) : 0;

    return `
      <tr>
        <td>Subject ${index + 1}: <strong>${escapeHtml(subj.name)}</strong></td>
        <td><strong>${mark}</strong> / ${subj.fullMarks}</td>
        <td>${subj.passMarks}</td>
        <td>
          <div class="subject-progress-bar">
            <div class="subject-progress-fill" style="width: ${percentageInSubj}%; background-color: ${isPassing ? '#10b981' : '#ef4444'};"></div>
          </div>
          <span style="font-size: 0.72rem; color: #64748b;">${percentageInSubj}%</span>
        </td>
        <td>
          <span style="font-weight: 700; color: ${isPassing ? '#10b981' : '#ef4444'};">
            ${isPassing ? 'Cleared ✓' : `Failed (< ${subj.passMarks}) ✗`}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="report-header-banner">
      <div>
        <div class="report-student-title">${escapeHtml(student.name)}</div>
        <div class="report-student-meta">Roll No: <strong>${escapeHtml(student.rollNo)}</strong> &bull; Class Rank: <strong>#${student.rank}</strong></div>
      </div>
      <div class="report-badges-right">
        <span class="badge-grade ${getGradeBadgeClass(student.grade)}" style="font-size: 1rem; padding: 6px 12px;">Grade ${student.grade}</span>
        <span class="status-pill ${student.status === 'Pass' ? 'status-pass' : 'status-fail'}">${student.status}</span>
      </div>
    </div>

    <div class="report-score-grid">
      <div class="report-score-box">
        <div class="label">Total Score</div>
        <div class="val">${student.totalMarks} <span style="font-size: 0.8rem; color: #64748b;">/ ${totalFullMarks}</span></div>
      </div>
      <div class="report-score-box">
        <div class="label">Percentage</div>
        <div class="val">${student.percentage}%</div>
      </div>
      <div class="report-score-box">
        <div class="label">Current Rank</div>
        <div class="val">#${student.rank}</div>
      </div>
    </div>

    <div class="report-subject-breakdown">
      <h4 style="margin-bottom: 10px; font-size: 1rem;">Subject Marks & Passing Thresholds</h4>
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Scored</th>
            <th>Pass Mark</th>
            <th style="width: 30%;">Performance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
        </tbody>
      </table>
    </div>

    <div class="report-remarks-box">
      <strong>Instructor Remarks & Assessment:</strong>
      <p style="margin-top: 4px;">${remarks}</p>
    </div>
  `;

  detailModal.classList.add('active');
}

// ==============================================================================
// 7. CSV Export & Utility Features
// ==============================================================================

// ==============================================================================
// 7. CSV Export & Import Features
// ==============================================================================

let parsedImportStudents = [];

/**
 * Exports current student table to CSV spreadsheet.
 */
function exportToCsv() {
  if (students.length === 0) {
    alert('No student records available to export.');
    return;
  }

  const subjectHeaders = subjects.map(s => `"${s.name} (Full ${s.fullMarks} / Pass ${s.passMarks})"`);
  const headers = ['Rank', 'Roll Number', 'Student Name', ...subjectHeaders, `Total (Max ${getTotalFullMarks()})`, 'Percentage', 'Grade', 'Status', 'Failed Subjects'];
  
  const rows = students.map(s => {
    const subjectScores = subjects.map(subj => s.marks[subj.id] !== undefined ? s.marks[subj.id] : '');
    const failedList = s.failedSubjects ? s.failedSubjects.join('; ') : '';
    return [
      s.rank,
      `"${s.rollNo}"`,
      `"${s.name}"`,
      ...subjectScores,
      s.totalMarks,
      `${s.percentage}%`,
      s.grade,
      s.status,
      `"${failedList}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + 
    [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Student_Performance_Custom_Passmarks_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads a clean, pre-formatted CSV template tailored to active subjects.
 */
function downloadCsvTemplate() {
  if (subjects.length === 0) {
    alert('Please configure at least one subject first before downloading template.');
    return;
  }

  const subjectHeaders = subjects.map(s => `"${s.name} (Max ${s.fullMarks})"`);
  const headers = ['Roll Number', 'Student Name', ...subjectHeaders];

  // Two realistic demo rows illustrating expected marks
  const sample1Marks = subjects.map(s => Math.round(s.fullMarks * 0.85));
  const sample2Marks = subjects.map(s => Math.round(s.fullMarks * 0.65));

  const sampleRows = [
    ['S-101', '"Sample Student A"', ...sample1Marks],
    ['S-102', '"Sample Student B"', ...sample2Marks]
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Student_Import_Template.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const importModal = document.getElementById('importModal');
const csvFileInput = document.getElementById('csvFileInput');
const csvDropZone = document.getElementById('csvDropZone');
const dropzoneFileName = document.getElementById('dropzoneFileName');
const importPreviewContainer = document.getElementById('importPreviewContainer');
const importPreviewSummary = document.getElementById('importPreviewSummary');
const importPreviewHead = document.getElementById('importPreviewHead');
const importPreviewBody = document.getElementById('importPreviewBody');
const btnConfirmImport = document.getElementById('btnConfirmImport');

function openImportModal() {
  parsedImportStudents = [];
  csvFileInput.value = '';
  dropzoneFileName.textContent = 'Supports comma-separated (.csv) files';
  importPreviewContainer.style.display = 'none';
  btnConfirmImport.disabled = true;
  importModal.classList.add('active');
}

function closeImportModal() {
  importModal.classList.remove('active');
}

/**
 * Robust CSV parser that correctly handles quoted strings containing commas.
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(s => s.replace(/^["']|["']$/g, '').trim());
}

/**
 * Parses raw CSV string and matches columns against the active curriculum.
 */
function processCsvContent(csvText) {
  const lines = csvText.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    alert('The uploaded CSV file is empty or missing headers.');
    return;
  }

  const rawHeaders = parseCsvLine(lines[0]);
  let rollColIdx = -1;
  let nameColIdx = -1;
  const subjectColMap = {}; // subj.id -> column index in CSV

  // Identify Roll Number & Name columns
  rawHeaders.forEach((h, idx) => {
    const clean = h.toLowerCase();
    if (clean.includes('roll') || clean.includes('id') || clean.includes('reg')) {
      if (rollColIdx === -1) rollColIdx = idx;
    } else if (clean.includes('name') || clean.includes('student')) {
      if (nameColIdx === -1) nameColIdx = idx;
    }
  });

  // Default fallback if not found by keywords
  if (rollColIdx === -1) rollColIdx = 0;
  if (nameColIdx === -1) nameColIdx = 1;

  // Match subject columns
  subjects.forEach((subj, sIdx) => {
    const subjNameLower = subj.name.toLowerCase();
    // Try finding header matching subject name
    const foundIdx = rawHeaders.findIndex(h => h.toLowerCase().includes(subjNameLower));
    if (foundIdx !== -1) {
      subjectColMap[subj.id] = foundIdx;
    } else {
      // Fallback: match by sequential column order starting after roll and name
      const fallbackIdx = 2 + sIdx;
      if (fallbackIdx < rawHeaders.length) {
        subjectColMap[subj.id] = fallbackIdx;
      }
    }
  });

  // Parse student data rows
  parsedImportStudents = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length === 0 || cols.every(c => c === '')) continue;

    const rollNo = cols[rollColIdx] || `S-${100 + i}`;
    const name = cols[nameColIdx] || `Student ${i}`;
    const marks = {};

    subjects.forEach(subj => {
      const colIdx = subjectColMap[subj.id];
      let val = colIdx !== undefined ? Number(cols[colIdx]) : 0;
      if (isNaN(val) || val < 0) val = 0;
      if (val > subj.fullMarks) val = subj.fullMarks; // Clamp to subject's full marks
      marks[subj.id] = val;
    });

    parsedImportStudents.push({
      id: 's-import-' + Date.now() + '-' + i,
      name,
      rollNo,
      marks
    });
  }

  if (parsedImportStudents.length === 0) {
    alert('No valid student rows could be parsed from the CSV.');
    return;
  }

  // Display Preview
  renderImportPreview();
}

/**
 * Renders preview table of the first 5 records parsed from CSV.
 */
function renderImportPreview() {
  importPreviewContainer.style.display = 'block';
  importPreviewSummary.textContent = `Parsed ${parsedImportStudents.length} student record(s) ready to import`;
  btnConfirmImport.disabled = false;

  // Build Preview Table Header
  const subjectHeadersHtml = subjects.map(s => `<th>${escapeHtml(s.name)} (${s.fullMarks})</th>`).join('');
  importPreviewHead.innerHTML = `
    <tr>
      <th>Roll No</th>
      <th>Student Name</th>
      ${subjectHeadersHtml}
    </tr>
  `;

  // Build Preview Table Rows (First 5)
  const previewSlice = parsedImportStudents.slice(0, 5);
  importPreviewBody.innerHTML = previewSlice.map(st => {
    const subjectCells = subjects.map(s => `<td>${st.marks[s.id]}</td>`).join('');
    return `
      <tr>
        <td><strong>${escapeHtml(st.rollNo)}</strong></td>
        <td>${escapeHtml(st.name)}</td>
        ${subjectCells}
      </tr>
    `;
  }).join('');
}

/**
 * Commits imported students to state and recalculates.
 */
function confirmImport() {
  if (parsedImportStudents.length === 0) return;

  const mode = document.querySelector('input[name="importMode"]:checked')?.value || 'append';

  if (mode === 'replace') {
    students = parsedImportStudents;
  } else {
    // Append or update existing roll numbers
    parsedImportStudents.forEach(newSt => {
      const existingIdx = students.findIndex(s => s.rollNo.toLowerCase() === newSt.rollNo.toLowerCase());
      if (existingIdx !== -1) {
        students[existingIdx] = newSt; // Update existing
      } else {
        students.push(newSt); // Add new
      }
    });
  }

  refreshStudentCalculations();
  saveToStorage();
  renderKPIs();
  renderTable();
  renderCharts();
  closeImportModal();
  alert(`Successfully loaded ${parsedImportStudents.length} students into the analyzer!`);
}

function loadSampleData() {
  subjects = JSON.parse(JSON.stringify(DEFAULT_PRESET_36));
  students = JSON.parse(JSON.stringify(DEFAULT_DEMO_STUDENTS));
  refreshStudentCalculations();
  saveToStorage();
  updateCurriculumUI();
  renderKPIs();
  renderTable();
  renderCharts();
}

function clearAllData() {
  if (students.length === 0) {
    alert('Student list is already empty.');
    return;
  }

  const confirmed = confirm('Are you sure you want to delete all student records? The subject curriculum will be preserved.');
  if (!confirmed) return;

  students = [];
  saveToStorage();
  renderKPIs();
  renderTable();
  renderCharts();
}

// ==============================================================================
// 8. Excel-Style Batch Student Entry Engine (Up to 70 Students)
// ==============================================================================

const MAX_EXCEL_STUDENTS = 70;
let excelGridData = [];

const excelGridModal = document.getElementById('excelGridModal');
const excelSpreadsheetContainer = document.getElementById('excelSpreadsheetContainer');
const excelGridHead = document.getElementById('excelGridHead');
const excelGridBody = document.getElementById('excelGridBody');
const excelGridCountBadge = document.getElementById('excelGridCountBadge');
const excelValidCount = document.getElementById('excelValidCount');
const excelPasteArea = document.getElementById('excelPasteArea');
const excelPasteInput = document.getElementById('excelPasteInput');

/**
 * Opens Excel Spreadsheet Batch Entry modal.
 */
function openExcelGridModal() {
  if (subjects.length === 0) {
    alert('Please configure your subjects first in "⚙️ Subject & Passmark Setup".');
    openSubjectConfigModal();
    return;
  }

  // Pre-load from current students if available, or create 25 empty rows
  if (students.length > 0) {
    excelGridData = students.slice(0, MAX_EXCEL_STUDENTS).map(s => ({
      rollNo: s.rollNo || '',
      name: s.name || '',
      marks: { ...s.marks }
    }));
    // If fewer than 10, pad to 10 rows
    while (excelGridData.length < 10) {
      excelGridData.push({ rollNo: '', name: '', marks: {} });
    }
  } else {
    // Default to 25 rows
    excelGridData = [];
    for (let i = 0; i < 25; i++) {
      excelGridData.push({ rollNo: '', name: '', marks: {} });
    }
  }

  renderExcelGridTable();
  excelGridModal.classList.add('active');
}

function closeExcelGridModal() {
  excelGridModal.classList.remove('active');
  excelPasteArea.style.display = 'none';
}

/**
 * Sets the exact number of rows in the Excel grid (e.g. 10, 25, 50, 70).
 */
function setExcelRowCount(targetCount) {
  const count = Math.min(MAX_EXCEL_STUDENTS, Math.max(1, targetCount));

  // Update active chip styling
  document.querySelectorAll('.excel-btn-group .btn-chip').forEach(btn => {
    btn.classList.toggle('active-chip', btn.textContent.includes(String(count)));
  });

  if (excelGridData.length < count) {
    while (excelGridData.length < count) {
      excelGridData.push({ rollNo: '', name: '', marks: {} });
    }
  } else if (excelGridData.length > count) {
    excelGridData = excelGridData.slice(0, count);
  }

  renderExcelGridTable();
}

/**
 * Adds a single row to the grid (up to 70).
 */
function addSingleExcelRow() {
  if (excelGridData.length >= MAX_EXCEL_STUDENTS) {
    alert(`Maximum limit of ${MAX_EXCEL_STUDENTS} students reached.`);
    return;
  }
  excelGridData.push({ rollNo: '', name: '', marks: {} });
  renderExcelGridTable();

  // Scroll to bottom
  excelSpreadsheetContainer.scrollTop = excelSpreadsheetContainer.scrollHeight;
}

/**
 * Removes a specific row from the grid.
 */
function removeExcelGridRow(index) {
  if (excelGridData.length <= 1) {
    excelGridData[0] = { rollNo: '', name: '', marks: {} };
  } else {
    excelGridData.splice(index, 1);
  }
  renderExcelGridTable();
}

/**
 * Renders the full Excel Spreadsheet Table.
 */
function renderExcelGridTable() {
  const totalFullMarks = getTotalFullMarks();
  const rowCount = excelGridData.length;

  excelGridCountBadge.textContent = `${rowCount} / ${MAX_EXCEL_STUDENTS} Rows`;

  // 1. Build Header
  const subjectHeadersHtml = subjects.map((subj, sIdx) => `
    <th>
      <div>S${sIdx + 1}: ${escapeHtml(subj.name)}</div>
      <span class="th-sub">Max: ${subj.fullMarks} | Pass: ${subj.passMarks}</span>
    </th>
  `).join('');

  excelGridHead.innerHTML = `
    <tr>
      <th style="width: 40px;">#</th>
      <th style="min-width: 110px;">Roll Number</th>
      <th style="min-width: 170px;">Student Name</th>
      ${subjectHeadersHtml}
      <th style="min-width: 90px;">Total (/${totalFullMarks})</th>
      <th style="min-width: 70px;">%</th>
      <th style="min-width: 120px;">Result Status</th>
      <th style="width: 40px;">Del</th>
    </tr>
  `;

  // 2. Build Body Rows
  let validCount = 0;
  excelGridBody.innerHTML = excelGridData.map((row, rIdx) => {
    const roll = row.rollNo || '';
    const name = row.name || '';

    // Calculate row metrics
    let rowTotal = 0;
    let hasAnyMarks = false;
    const failedSubjs = [];

    subjects.forEach(subj => {
      const valStr = row.marks[subj.id];
      if (valStr !== undefined && valStr !== '') {
        hasAnyMarks = true;
        const numVal = Number(valStr) || 0;
        rowTotal += numVal;
        if (numVal < subj.passMarks) {
          failedSubjs.push(subj.name);
        }
      }
    });

    const isRowFilled = roll !== '' || name !== '' || hasAnyMarks;
    if (isRowFilled) validCount++;

    const percentage = totalFullMarks > 0 ? ((rowTotal / totalFullMarks) * 100).toFixed(1) : 0;
    const isPass = hasAnyMarks && failedSubjs.length === 0;

    let statusBadgeHtml = '<span style="color: #94a3b8;">-</span>';
    if (hasAnyMarks) {
      if (isPass) {
        statusBadgeHtml = `<span class="excel-status-badge excel-status-pass">✓ PASS</span>`;
      } else {
        const failLabel = failedSubjs.length > 0 ? `FAIL (${failedSubjs.join(',')})` : 'FAIL';
        statusBadgeHtml = `<span class="excel-status-badge excel-status-fail" title="Failed in: ${failedSubjs.join(', ')}">✗ ${failLabel}</span>`;
      }
    }

    // Build subject input cells
    const subjectCellsHtml = subjects.map((subj, sIdx) => {
      const markVal = row.marks[subj.id] !== undefined ? row.marks[subj.id] : '';
      const isFailed = markVal !== '' && Number(markVal) < subj.passMarks;
      return `
        <td>
          <input 
            type="number" 
            class="excel-grid-input excel-input-mark ${isFailed ? 'excel-cell-fail' : ''}" 
            min="0" 
            max="${subj.fullMarks}" 
            data-row="${rIdx}" 
            data-col="${2 + sIdx}" 
            data-subj-id="${subj.id}"
            data-pass-marks="${subj.passMarks}"
            data-full-marks="${subj.fullMarks}"
            value="${markVal}"
            placeholder="0-${subj.fullMarks}"
            title="${subj.name}: Max ${subj.fullMarks}, Pass ${subj.passMarks}"
          >
        </td>
      `;
    }).join('');

    return `
      <tr data-row="${rIdx}">
        <td class="excel-row-num">${rIdx + 1}</td>
        <td>
          <input 
            type="text" 
            class="excel-grid-input" 
            data-row="${rIdx}" 
            data-col="0" 
            data-field="rollNo"
            value="${escapeHtml(roll)}" 
            placeholder="e.g. S-${101 + rIdx}"
          >
        </td>
        <td>
          <input 
            type="text" 
            class="excel-grid-input" 
            data-row="${rIdx}" 
            data-col="1" 
            data-field="name"
            value="${escapeHtml(name)}" 
            placeholder="Student Name"
          >
        </td>
        ${subjectCellsHtml}
        <td class="excel-calc-cell row-total-${rIdx}">${hasAnyMarks ? `${rowTotal} / ${totalFullMarks}` : '-'}</td>
        <td class="excel-calc-cell row-pct-${rIdx}">${hasAnyMarks ? `${percentage}%` : '-'}</td>
        <td class="excel-calc-cell row-status-${rIdx}">${statusBadgeHtml}</td>
        <td style="text-align: center;">
          <button type="button" class="btn-excel-row-del" onclick="removeExcelGridRow(${rIdx})" title="Delete row">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');

  excelValidCount.textContent = validCount;

  // Attach fast keyboard navigation & direct input listener
  attachExcelGridEventListeners();
}

/**
 * Attaches real-time input listener & spreadsheet keyboard navigation (Enter, Tab, Arrows).
 */
function attachExcelGridEventListeners() {
  const inputs = excelSpreadsheetContainer.querySelectorAll('.excel-grid-input');

  inputs.forEach(input => {
    // Real-time input synchronization without rebuilding table (prevents losing cursor focus)
    input.addEventListener('input', (e) => {
      const rowIdx = parseInt(input.getAttribute('data-row'), 10);
      const field = input.getAttribute('data-field');
      const subjId = input.getAttribute('data-subj-id');

      if (field) {
        excelGridData[rowIdx][field] = input.value.trim();
      } else if (subjId) {
        const fullMarks = Number(input.getAttribute('data-full-marks')) || 100;
        const passMarks = Number(input.getAttribute('data-pass-marks')) || 36;
        let valStr = input.value;
        let numVal = Number(valStr);

        if (valStr !== '' && numVal > fullMarks) {
          input.value = fullMarks;
          numVal = fullMarks;
        }

        excelGridData[rowIdx].marks[subjId] = input.value;

        // Toggle fail highlight on this cell
        if (valStr !== '' && numVal < passMarks) {
          input.classList.add('excel-cell-fail');
        } else {
          input.classList.remove('excel-cell-fail');
        }
      }

      // Live update this specific row's Total, %, and Status badge
      updateExcelRowCalculations(rowIdx);
    });

    // Keyboard navigation (Excel behavior: Enter moves down, Arrow navigation)
    input.addEventListener('keydown', (e) => {
      const rowIdx = parseInt(input.getAttribute('data-row'), 10);
      const colIdx = parseInt(input.getAttribute('data-col'), 10);

      if (e.key === 'Enter') {
        e.preventDefault();
        // Move to cell in the row below
        const nextInput = excelSpreadsheetContainer.querySelector(
          `.excel-grid-input[data-row="${rowIdx + 1}"][data-col="${colIdx}"]`
        );
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        } else if (rowIdx === excelGridData.length - 1 && excelGridData.length < MAX_EXCEL_STUDENTS) {
          // If on last row, auto-add a new row!
          addSingleExcelRow();
          const brandNew = excelSpreadsheetContainer.querySelector(
            `.excel-grid-input[data-row="${rowIdx + 1}"][data-col="${colIdx}"]`
          );
          if (brandNew) brandNew.focus();
        }
      } else if (e.key === 'ArrowDown') {
        const nextInput = excelSpreadsheetContainer.querySelector(
          `.excel-grid-input[data-row="${rowIdx + 1}"][data-col="${colIdx}"]`
        );
        if (nextInput) nextInput.focus();
      } else if (e.key === 'ArrowUp') {
        const prevInput = excelSpreadsheetContainer.querySelector(
          `.excel-grid-input[data-row="${rowIdx - 1}"][data-col="${colIdx}"]`
        );
        if (prevInput) prevInput.focus();
      }
    });

    // Handle Direct Paste (Ctrl+V) from Excel onto any cell!
    input.addEventListener('paste', handleExcelCellPaste);
  });
}

/**
 * Updates row calculation cells (Total, %, Status) live as teacher types in marks.
 */
function updateExcelRowCalculations(rIdx) {
  const row = excelGridData[rIdx];
  const totalFullMarks = getTotalFullMarks();

  let rowTotal = 0;
  let hasAnyMarks = false;
  const failedSubjs = [];

  subjects.forEach(subj => {
    const valStr = row.marks[subj.id];
    if (valStr !== undefined && valStr !== '') {
      hasAnyMarks = true;
      const numVal = Number(valStr) || 0;
      rowTotal += numVal;
      if (numVal < subj.passMarks) {
        failedSubjs.push(subj.name);
      }
    }
  });

  const percentage = totalFullMarks > 0 ? ((rowTotal / totalFullMarks) * 100).toFixed(1) : 0;
  const isPass = hasAnyMarks && failedSubjs.length === 0;

  const totalEl = excelSpreadsheetContainer.querySelector(`.row-total-${rIdx}`);
  const pctEl = excelSpreadsheetContainer.querySelector(`.row-pct-${rIdx}`);
  const statusEl = excelSpreadsheetContainer.querySelector(`.row-status-${rIdx}`);

  if (totalEl) totalEl.textContent = hasAnyMarks ? `${rowTotal} / ${totalFullMarks}` : '-';
  if (pctEl) pctEl.textContent = hasAnyMarks ? `${percentage}%` : '-';
  if (statusEl) {
    if (hasAnyMarks) {
      if (isPass) {
        statusEl.innerHTML = `<span class="excel-status-badge excel-status-pass">✓ PASS</span>`;
      } else {
        const failLabel = failedSubjs.length > 0 ? `FAIL (${failedSubjs.join(',')})` : 'FAIL';
        statusEl.innerHTML = `<span class="excel-status-badge excel-status-fail" title="Failed in: ${failedSubjs.join(', ')}">✗ ${failLabel}</span>`;
      }
    } else {
      statusEl.innerHTML = '<span style="color: #94a3b8;">-</span>';
    }
  }

  // Update valid count badge
  let validCount = 0;
  excelGridData.forEach(r => {
    const hasData = r.rollNo || r.name || Object.values(r.marks).some(v => v !== '');
    if (hasData) validCount++;
  });
  excelValidCount.textContent = validCount;
}

/**
 * Handles pasting cells directly copied from Excel (tab-separated rows and columns).
 */
function handleExcelCellPaste(e) {
  const clipboardData = e.clipboardData || window.clipboardData;
  if (!clipboardData) return;

  const pastedText = clipboardData.getData('Text');
  if (!pastedText || (!pastedText.includes('\t') && !pastedText.includes('\n'))) {
    // Normal single value paste, let default handle it
    return;
  }

  e.preventDefault();

  const startRow = parseInt(e.target.getAttribute('data-row'), 10) || 0;
  const startCol = parseInt(e.target.getAttribute('data-col'), 10) || 0;

  parseAndPopulateExcelClipboard(pastedText, startRow, startCol);
}

/**
 * Parses tab/newline separated text from Microsoft Excel and populates the grid.
 */
function parseAndPopulateExcelClipboard(text, startRow = 0, startCol = 0) {
  const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return;

  // Ensure enough rows exist (up to 70)
  const neededRows = Math.min(MAX_EXCEL_STUDENTS, startRow + lines.length);
  while (excelGridData.length < neededRows) {
    excelGridData.push({ rollNo: '', name: '', marks: {} });
  }

  lines.forEach((line, lineOffset) => {
    const targetRow = startRow + lineOffset;
    if (targetRow >= MAX_EXCEL_STUDENTS) return;

    // Split by tab (Excel format) or comma fallback
    const cells = line.includes('\t') ? line.split('\t') : line.split(',');

    cells.forEach((cellVal, colOffset) => {
      const targetCol = startCol + colOffset;
      const cleanVal = cellVal.replace(/^["']|["']$/g, '').trim();

      if (targetCol === 0) {
        excelGridData[targetRow].rollNo = cleanVal;
      } else if (targetCol === 1) {
        excelGridData[targetRow].name = cleanVal;
      } else {
        const subjIdx = targetCol - 2;
        if (subjIdx < subjects.length) {
          const subj = subjects[subjIdx];
          const num = Number(cleanVal);
          if (!isNaN(num)) {
            excelGridData[targetRow].marks[subj.id] = Math.min(subj.fullMarks, Math.max(0, num));
          }
        }
      }
    });
  });

  renderExcelGridTable();
  alert(`Pasted ${lines.length} student rows from Excel successfully!`);
}

/**
 * Toggles the helper text box for pasting from Excel.
 */
function toggleExcelPasteArea() {
  const isHidden = excelPasteArea.style.display === 'none';
  excelPasteArea.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) excelPasteInput.focus();
}

/**
 * Applies text from the manual paste textarea.
 */
document.getElementById('btnApplyExcelPaste')?.addEventListener('click', () => {
  const text = excelPasteInput.value;
  if (!text.trim()) {
    alert('Please paste your Excel data into the box first.');
    return;
  }
  parseAndPopulateExcelClipboard(text, 0, 0);
  excelPasteArea.style.display = 'none';
  excelPasteInput.value = '';
});

/**
 * Fills realistic student data for quick demonstration.
 */
function fillDemoExcelData() {
  const firstNames = ['Alexander', 'Sophia', 'Benjamin', 'Mia', 'Lucas', 'Charlotte', 'Ethan', 'Amelia', 'Noah', 'Harper', 'James', 'Evelyn', 'Liam', 'Abigail', 'Oliver', 'Emily', 'Elijah', 'Elizabeth', 'Mason', 'Avery'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

  const count = Math.min(25, excelGridData.length || 25);
  excelGridData = [];

  for (let i = 0; i < count; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const roll = `S-${101 + i}`;
    const marks = {};

    subjects.forEach((subj, sIdx) => {
      // Intentionally make 2 students fail in Subject 1 (< 36) to demonstrate the automatic fail rule!
      if (i === 4 && sIdx === 0) {
        marks[subj.id] = 32; // Failed in Subject 1!
      } else if (i === 11 && sIdx === 1) {
        marks[subj.id] = 28; // Failed in Subject 2!
      } else {
        // High passing mark between 55 and 98
        const basePct = 0.55 + ((i * 7 + sIdx * 11) % 43) / 100;
        marks[subj.id] = Math.round(subj.fullMarks * basePct);
      }
    });

    excelGridData.push({ rollNo: roll, name: `${fn} ${ln}`, marks });
  }

  renderExcelGridTable();
}

/**
 * Clears the grid after confirmation.
 */
function clearExcelGrid() {
  const confirmed = confirm('Clear all rows in the Excel spreadsheet grid?');
  if (!confirmed) return;

  excelGridData = [];
  for (let i = 0; i < 15; i++) {
    excelGridData.push({ rollNo: '', name: '', marks: {} });
  }
  renderExcelGridTable();
}

/**
 * Commits the Excel grid students into the Analyzer.
 */
function saveExcelGridToAnalyzer() {
  // Extract non-empty students
  const validStudents = [];

  excelGridData.forEach((row, i) => {
    const roll = (row.rollNo || '').trim();
    const name = (row.name || '').trim();
    const hasMarks = Object.values(row.marks).some(v => v !== undefined && v !== '');

    if (roll || name || hasMarks) {
      const cleanMarks = {};
      subjects.forEach(subj => {
        const val = Number(row.marks[subj.id]);
        cleanMarks[subj.id] = (!isNaN(val) && val >= 0) ? Math.min(subj.fullMarks, val) : 0;
      });

      validStudents.push({
        id: 's-excel-' + Date.now() + '-' + i,
        name: name || `Student ${i + 1}`,
        rollNo: roll || `S-${101 + i}`,
        marks: cleanMarks
      });
    }
  });

  if (validStudents.length === 0) {
    alert('No student records found to save. Please enter student names or marks in the grid.');
    return;
  }

  const mode = document.querySelector('input[name="excelSaveMode"]:checked')?.value || 'replace';

  if (mode === 'replace') {
    students = validStudents;
  } else {
    // Append or update existing roll numbers
    validStudents.forEach(newSt => {
      const existingIdx = students.findIndex(s => s.rollNo.toLowerCase() === newSt.rollNo.toLowerCase());
      if (existingIdx !== -1) {
        students[existingIdx] = newSt;
      } else {
        students.push(newSt);
      }
    });
  }

  refreshStudentCalculations();
  saveToStorage();
  renderKPIs();
  renderTable();
  renderCharts();
  closeExcelGridModal();

  alert(`✅ Successfully loaded ${validStudents.length} student records into the analyzer!`);
}

// ==============================================================================
// 9. Event Listeners & Global Handlers
// ==============================================================================

function setupEventListeners() {
  // Modal buttons
  document.getElementById('btnOpenSubjectConfig').addEventListener('click', openSubjectConfigModal);
  document.getElementById('btnCloseSubjectConfig').addEventListener('click', closeSubjectConfigModal);
  document.getElementById('btnCancelSubjectConfig').addEventListener('click', closeSubjectConfigModal);

  document.getElementById('btnOpenAddModal').addEventListener('click', openAddStudentModal);
  document.getElementById('btnEmptyAdd').addEventListener('click', openAddStudentModal);
  document.getElementById('btnEmptyConfig').addEventListener('click', openSubjectConfigModal);
  document.getElementById('btnCloseModal').addEventListener('click', closeModal);
  document.getElementById('btnCancelModal').addEventListener('click', closeModal);
  document.getElementById('btnCloseDetailModal').addEventListener('click', closeModal);
  document.getElementById('btnCloseReport').addEventListener('click', closeModal);

  // Excel Grid Modal buttons
  document.getElementById('btnOpenExcelGrid').addEventListener('click', openExcelGridModal);
  const btnEmptyExcel = document.getElementById('btnEmptyExcel');
  if (btnEmptyExcel) btnEmptyExcel.addEventListener('click', openExcelGridModal);
  document.getElementById('btnCloseExcelGrid').addEventListener('click', closeExcelGridModal);
  document.getElementById('btnCancelExcelGrid').addEventListener('click', closeExcelGridModal);
  document.getElementById('btnAddSingleExcelRow').addEventListener('click', addSingleExcelRow);
  document.getElementById('btnFillDemoExcel').addEventListener('click', fillDemoExcelData);
  document.getElementById('btnClearExcelGrid').addEventListener('click', clearExcelGrid);
  document.getElementById('btnOpenPasteModal').addEventListener('click', toggleExcelPasteArea);
  document.getElementById('btnSaveExcelGrid').addEventListener('click', saveExcelGridToAnalyzer);

  // Import CSV Modal buttons
  document.getElementById('btnOpenImportModal').addEventListener('click', openImportModal);
  const btnEmptyImport = document.getElementById('btnEmptyImport');
  if (btnEmptyImport) btnEmptyImport.addEventListener('click', openImportModal);
  document.getElementById('btnCloseImportModal').addEventListener('click', closeImportModal);
  document.getElementById('btnCancelImport').addEventListener('click', closeImportModal);
  document.getElementById('btnDownloadTemplate').addEventListener('click', downloadCsvTemplate);
  document.getElementById('btnConfirmImport').addEventListener('click', confirmImport);

  // CSV Drag and Drop / File Selection
  csvDropZone.addEventListener('click', () => csvFileInput.click());

  csvFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleSelectedCsvFile(file);
  });

  csvDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    csvDropZone.classList.add('dragover');
  });

  csvDropZone.addEventListener('dragleave', () => {
    csvDropZone.classList.remove('dragover');
  });

  csvDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    csvDropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleSelectedCsvFile(file);
  });

  // Close modals on backdrop click
  subjectConfigModal.addEventListener('click', (e) => {
    if (e.target === subjectConfigModal) closeSubjectConfigModal();
  });
  studentModal.addEventListener('click', (e) => {
    if (e.target === studentModal) closeModal();
  });
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeModal();
  });
  importModal.addEventListener('click', (e) => {
    if (e.target === importModal) closeImportModal();
  });
  excelGridModal.addEventListener('click', (e) => {
    if (e.target === excelGridModal) closeExcelGridModal();
  });

  // Action buttons
  document.getElementById('btnLoadSample').addEventListener('click', loadSampleData);
  document.getElementById('btnExportCsv').addEventListener('click', exportToCsv);
  document.getElementById('btnClearData').addEventListener('click', clearAllData);
  document.getElementById('btnPrintReport').addEventListener('click', () => window.print());

  // Search & Filter
  document.getElementById('searchInput').addEventListener('input', renderTable);
  document.getElementById('gradeFilter').addEventListener('change', renderTable);
  document.getElementById('statusFilter').addEventListener('change', renderTable);
}

function handleSelectedCsvFile(file) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    alert('Please select a valid .csv file.');
    return;
  }
  dropzoneFileName.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  const reader = new FileReader();
  reader.onload = (event) => {
    processCsvContent(event.target.result);
  };
  reader.readAsText(file);
}

// Global exposure for inline onclick attributes
window.openSubjectConfigModal = openSubjectConfigModal;
window.closeSubjectConfigModal = closeSubjectConfigModal;
window.openExcelGridModal = openExcelGridModal;
window.closeExcelGridModal = closeExcelGridModal;
window.setExcelRowCount = setExcelRowCount;
window.addSingleExcelRow = addSingleExcelRow;
window.removeExcelGridRow = removeExcelGridRow;
window.toggleExcelPasteArea = toggleExcelPasteArea;
window.fillDemoExcelData = fillDemoExcelData;
window.clearExcelGrid = clearExcelGrid;
window.saveExcelGridToAnalyzer = saveExcelGridToAnalyzer;
window.openImportModal = openImportModal;
window.closeImportModal = closeImportModal;
window.removeSubjectRow = removeSubjectRow;
window.quickSetSubjectCount = quickSetSubjectCount;
window.applyPreset = applyPreset;
window.handleFullMarksChange = handleFullMarksChange;
window.viewStudentReport = viewStudentReport;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadFromStorage();
  updateCurriculumUI();
  renderKPIs();
  renderTable();
  renderCharts();
});
