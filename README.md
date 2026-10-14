# 📊 Student Performance Analyzer (Custom Curriculum, Full Marks & Pass Marks)

A beginner-friendly, responsive web application tailored for teachers to analyze student academic performance. 

Teachers can define their own custom subjects, exact **Full Marks**, and individual **Pass Marks** (for example: **Subject 1 = Maths, Fullmarks = 100, Passmark = 36**) for up to **20 subjects**.

---

## 🎯 How Subject Configuration Works

In the **⚙️ Subject & Passmark Setup** modal:
1. Teachers can set the number of subjects (up to 20) or click **➕ Add Subject Row**.
2. For each subject row, teachers directly enter:
   - **Subject Label**: `Subject 1`, `Subject 2`, ..., up to `Subject 20`.
   - **Subject Name**: e.g., `Maths`, `Physics (Theory)`, `Science Lab`, etc.
   - **Full Marks (Max Marks)**: e.g., `100`, `75`, `50`, `25`.
   - **Pass Mark**: e.g., `36`, `27`, `18`, `9`.
3. Quick Set buttons (`3 Subj`, `5 Subj`, `8 Subj`, `10 Subj`, `15 Subj`, `20 Subj`) let teachers build a curriculum in one click.
4. Presets like **Standard 5 (Full 100, Pass 36)** provide realistic exam setups right away.

---

## 🧮 Automatic Dynamic Academic Calculations

1. **Total Full Marks**:
   $$\text{Total Full Marks} = \sum_{i=1}^{k} \text{FullMarks}_i$$

2. **Total Marks Scored**:
   $$\text{Total Scored} = \sum_{i=1}^{k} M_i$$

3. **Percentage**:
   $$\text{Percentage} = \left( \frac{\text{Total Scored}}{\text{Total Full Marks}} \right) \times 100$$

4. **Strict Subject-Specific Pass/Fail Rule**:
   - **PASS**: If a student secures $\text{Marks} \ge 36$ (or $\ge \text{Pass Mark}$) in **every single subject**, the student **PASSES** (`✓ PASS`).
   - **AUTOMATIC FAIL**: If a student gets less than 36 ($< 36$) in even **1 subject**, the student is **AUTOMATICALLY FAILED** (`✗ FAIL`), regardless of how high their total marks or percentage are.
   - If failed in 1 or more subjects, the final letter grade is automatically set to **`F`**, and the exact failed subjects are listed (e.g. `Fail (Maths)`).

5. **Letter Grades & Class Ranks**:
   - For students who pass all subjects:
     - `A+` ($\ge 90\%$), `A` ($\ge 80\%$), `B` ($\ge 70\%$), `C` ($\ge 60\%$), `D` ($\ge 50\%$).
   - Students failing any subject automatically receive Grade **`F`**.
   - Dynamic class rank computed automatically by percentage.

---

## 📑 Excel-Style Batch Student Entry (Up to 70 Students)

Teachers can add and manage up to **70 students at a time** in an interactive spreadsheet format:
1. Click **`📑 Excel Batch Entry (Up to 70)`** in the header.
2. **Quick Row Generation**: One-click generation of `10 Rows`, `25 Rows`, `50 Rows`, or `70 Rows (Max)`.
3. **Excel-like Data Entry**:
   - Type Roll Numbers, Student Names, and Subject Marks row by row.
   - **Keyboard Navigation**: Pressing `Enter` automatically jumps to the row below (just like Excel). Pressing `Tab` jumps to the next cell.
4. **Copy & Paste Directly from Excel / Google Sheets**:
   - Copy any table from Excel (`Ctrl+C`), click any cell in the grid, and paste (`Ctrl+V`). The analyzer automatically maps the columns across rows and expands up to 70 students!
5. **Real-time Live Row Calculations**:
   - Total marks, percentage, and Pass/Fail status are calculated live inside each spreadsheet row.
   - Marks $< 36$ instantly turn red with an automatic `✗ FAIL` tag.
6. **Save to Analyzer**:
   - Save mode options: Overwrite (`Replace`) or `Append` to existing class records.
   - Saves all rows in one click into the dashboard, tables, and visual charts.

- **Curriculum Overview Banner**: Sticky top banner displaying active subjects and their parameters (e.g. `S1: Maths (100/36)`).
- **Dynamic Table with Subject Headers**: Table columns dynamically show `S1: Maths | Full: 100, Pass: 36`. Cells highlight failing subject scores in red.
- **Add / Edit Student Modal with Live Validation**: While entering marks, inputs validate against `0 <= Mark <= FullMarks` and show instant live feedback: `✓ Passing (>= 36)` or `⚠️ Below Pass Mark (36)`.
- **Student Report Card**: Comprehensive report card showing individual subject progress, marks scored, pass mark required, and auto-generated teacher remarks.
- **Chart.js Visualizations**: Grade distribution doughnut chart and subject-wise average percentage bar chart.
- **Data Export & Persistence**: One-click CSV export and persistent browser `localStorage`.

---

## 🏃 Running the Application

### Method 1: Direct Browser Launch
Open in your file browser and double-click:
[`index.html`](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/student-performance-analyzer/index.html)
Located at:
`C:\Users\LENOVO\.gemini\antigravity\scratch\student-performance-analyzer\index.html`

### Method 2: Local Server via Python
```powershell
python -m http.server 3000 --directory "C:\Users\LENOVO\.gemini\antigravity\scratch\student-performance-analyzer"
```
Navigate to **`http://localhost:3000`** in any web browser.
