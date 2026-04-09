import * as XLSX from 'xlsx';

// Single Excel file to store all data
const EXCEL_FILE = 'attendance_system.xlsx';

// Data structure to hold all information
let appData = {
  students: [],
  faculty: [],
  attendance: [],
  requests: []
};

// Load from localStorage function
const loadFromLocalStorage = () => {
  try {
    const savedData = localStorage.getItem(EXCEL_FILE);
    if (savedData) {
      appData = JSON.parse(savedData);
    } else {
      // Initialize with demo data
      appData = {
        students: [
          {
            registerNo: '2021001',
            name: 'John Doe',
            dept: 'Computer Science',
            section: 'A', // Section A
            password: 'student123',
            email: 'john@college.edu',
            phone: '1234567890',
            registeredDate: new Date().toISOString()
          },
          {
            registerNo: '2021002',
            name: 'Jane Smith',
            dept: 'Computer Science',
            section: 'B', // Section B
            password: 'student123',
            email: 'jane@college.edu',
            phone: '1234567891',
            registeredDate: new Date().toISOString()
          },
          {
            registerNo: '2021003',
            name: 'Mike Johnson',
            dept: 'Computer Science',
            section: 'C', // Section C
            password: 'student123',
            email: 'mike@college.edu',
            phone: '1234567892',
            registeredDate: new Date().toISOString()
          }
        ],
        faculty: [
          {
            facultyId: 'FAC001',
            name: 'Kalai',
            dept: 'Computer Science',
            assignedSection: 'A', // Assigned to Section A
            password: 'faculty123',
            email: 'kalai@college.edu',
            phone: '9876543210',
            registeredDate: new Date().toISOString()
          },
          {
            facultyId: 'FAC002',
            name: 'Maran',
            dept: 'Computer Science',
            assignedSection: 'B', // Assigned to Section B
            password: 'faculty123',
            email: 'maran@college.edu',
            phone: '9876543211',
            registeredDate: new Date().toISOString()
          },
          {
            facultyId: 'FAC003',
            name: 'Siva',
            dept: 'Computer Science',
            assignedSection: 'C', // Assigned to Section C
            password: 'faculty123',
            email: 'siva@college.edu',
            phone: '9876543212',
            registeredDate: new Date().toISOString()
          }
        ],
        attendance: [],
        requests: []
      };
      saveToLocalStorage();
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
};

// Save to localStorage
const saveToLocalStorage = () => {
  try {
    localStorage.setItem(EXCEL_FILE, JSON.stringify(appData));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Initialize data - call this when app starts
export const initializeAppData = () => {
  loadFromLocalStorage();
};

// Call it once to initialize
initializeAppData();

// ============ STUDENT FUNCTIONS ============
export const getStudents = () => {
  return [...appData.students];
};

export const getStudentsBySection = (section) => {
  return appData.students.filter(s => s.section === section);
};

export const addStudent = (studentData) => {
  const newStudent = {
    registerNo: studentData[0],
    name: studentData[1],
    dept: studentData[2],
    section: studentData[3],
    password: studentData[4],
    email: studentData[5],
    phone: studentData[6],
    registeredDate: studentData[7] || new Date().toISOString()
  };
  appData.students.push(newStudent);
  saveToLocalStorage();
  return newStudent;
};

// ============ FACULTY FUNCTIONS ============
export const getFaculty = () => {
  return [...appData.faculty];
};

export const getFacultyBySection = (section) => {
  return appData.faculty.filter(f => f.assignedSection === section);
};

export const addFaculty = (facultyData) => {
  const newFaculty = {
    facultyId: facultyData[0],
    name: facultyData[1],
    dept: facultyData[2],
    assignedSection: facultyData[3], // Now includes assigned section
    password: facultyData[4],
    email: facultyData[5],
    phone: facultyData[6],
    registeredDate: facultyData[7] || new Date().toISOString()
  };
  appData.faculty.push(newFaculty);
  saveToLocalStorage();
  return newFaculty;
};

// ============ ATTENDANCE FUNCTIONS ============
export const getAttendance = (date = null, section = null) => {
  let attendance = [...appData.attendance];
  
  if (date) {
    attendance = attendance.filter(a => a.date === date);
  }
  
  if (section) {
    // Get students in this section
    const sectionStudents = appData.students
      .filter(s => s.section === section)
      .map(s => s.registerNo);
    attendance = attendance.filter(a => sectionStudents.includes(a.registerNo));
  }
  
  return attendance;
};

export const markAttendanceInExcel = (registerNo, name, hour) => {
  const today = new Date().toISOString().split('T')[0];
  
  const existingIndex = appData.attendance.findIndex(
    a => a.date === today && a.registerNo === registerNo
  );

  if (existingIndex >= 0) {
    // Update existing record
    appData.attendance[existingIndex][`hour${hour}`] = 'present';
  } else {
    // Create new record
    const newRecord = {
      date: today,
      registerNo,
      name,
      hour1: 'absent',
      hour2: 'absent',
      hour3: 'absent',
      hour4: 'absent',
      hour5: 'absent',
      hour6: 'absent'
    };
    newRecord[`hour${hour}`] = 'present';
    appData.attendance.push(newRecord);
  }

  saveToLocalStorage();
  return appData.attendance;
};

export const getStudentAttendance = (registerNo) => {
  const today = new Date().toISOString().split('T')[0];
  const record = appData.attendance.find(
    a => a.date === today && a.registerNo === registerNo
  );

  const byHour = {
    hour1: false,
    hour2: false,
    hour3: false,
    hour4: false,
    hour5: false,
    hour6: false
  };

  let presentCount = 0;

  if (record) {
    [1, 2, 3, 4, 5, 6].forEach(hour => {
      const status = record[`hour${hour}`];
      if (status === 'present') {
        byHour[`hour${hour}`] = true;
        presentCount++;
      }
    });
  }

  // Check for approved OD requests
  const todayRequests = appData.requests.filter(
    r => r.date === today && r.registerNo === registerNo && r.status === 'Approved'
  );

  todayRequests.forEach(request => {
    const hourKey = `hour${request.hour}`;
    if (request.category === 'od' || request.category === 'permission' || request.category === 'leave') {
      byHour[hourKey] = 'od';
    }
  });

  return {
    present: presentCount,
    absent: 6 - presentCount - Object.values(byHour).filter(v => v === 'od').length,
    byHour
  };
};

// ============ REQUESTS FUNCTIONS ============
export const submitRequest = (requestData) => {
  const newRequest = {
    id: `REQ${Date.now()}`,
    ...requestData,
    status: 'Pending',
    submittedDate: new Date().toISOString()
  };
  
  appData.requests.push(newRequest);
  saveToLocalStorage();
  return newRequest;
};

export const getStudentRequests = (registerNo) => {
  return appData.requests
    .filter(r => r.registerNo === registerNo)
    .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
};

export const getAllRequests = () => {
  return [...appData.requests];
};

export const updateRequestStatus = (requestId, newStatus) => {
  const request = appData.requests.find(r => r.id === requestId);
  if (request) {
    request.status = newStatus;
    saveToLocalStorage();
  }
};

// ============ FACULTY DASHBOARD FUNCTIONS ============
export const getStudentsWithAttendance = (facultySection = null) => {
  const today = new Date().toISOString().split('T')[0];
  
  // If faculty section is provided, filter students by that section
  let studentsToShow = appData.students;
  if (facultySection) {
    studentsToShow = appData.students.filter(s => s.section === facultySection);
  }
  
  return studentsToShow.map(student => {
    const attendance = appData.attendance.find(
      a => a.date === today && a.registerNo === student.registerNo
    );
    
    const present = [];
    const absent = [];
    
    [1, 2, 3, 4, 5, 6].forEach(hour => {
      const hourStatus = attendance ? attendance[`hour${hour}`] : 'absent';
      const hasOD = appData.requests.some(
        r => r.date === today && 
             r.registerNo === student.registerNo && 
             r.hour === hour && 
             r.status === 'Approved'
      );
      
      if (hasOD) {
        // Don't count as present or absent for OD
      } else if (hourStatus === 'present') {
        present.push(hour);
      } else {
        absent.push(hour);
      }
    });
    
    return {
      ...student,
      present,
      absent,
      presentCount: present.length,
      absentCount: absent.length
    };
  });
};

// ============ EXCEL FILE FUNCTIONS (for compatibility) ============
export const readExcelFile = (filename) => {
  // This function exists for compatibility with existing code
  // It returns data in the format expected by components
  
  if (filename === 'requests.xlsx') {
    const headers = ['RequestID', 'RegisterNo', 'Name', 'Date', 'Hour', 'Category', 'Reason', 'Status', 'SubmittedDate'];
    const rows = appData.requests.map(r => [
      r.id,
      r.registerNo,
      r.name,
      r.date,
      r.hour,
      r.category,
      r.reason,
      r.status,
      r.submittedDate
    ]);
    return [headers, ...rows];
  }
  
  if (filename === 'attendance.xlsx') {
    const headers = ['Date', 'RegisterNo', 'Name', 'Hour1', 'Hour2', 'Hour3', 'Hour4', 'Hour5', 'Hour6'];
    const rows = appData.attendance.map(a => [
      a.date,
      a.registerNo,
      a.name,
      a.hour1 || 'absent',
      a.hour2 || 'absent',
      a.hour3 || 'absent',
      a.hour4 || 'absent',
      a.hour5 || 'absent',
      a.hour6 || 'absent'
    ]);
    return [headers, ...rows];
  }
  
  if (filename === 'students.xlsx') {
    const headers = ['RegisterNo', 'Name', 'Department', 'Section', 'Password', 'Email', 'Phone', 'RegisteredDate'];
    const rows = appData.students.map(s => [
      s.registerNo,
      s.name,
      s.dept,
      s.section,
      s.password,
      s.email,
      s.phone,
      s.registeredDate
    ]);
    return [headers, ...rows];
  }
  
  if (filename === 'faculty.xlsx') {
    const headers = ['FacultyID', 'Name', 'Department', 'AssignedSection', 'Password', 'Email', 'Phone', 'RegisteredDate'];
    const rows = appData.faculty.map(f => [
      f.facultyId,
      f.name,
      f.dept,
      f.assignedSection,
      f.password,
      f.email,
      f.phone,
      f.registeredDate
    ]);
    return [headers, ...rows];
  }
  
  return null;
};

export const saveExcelFile = (filename, data) => {
  // This function exists for compatibility
  // For export functionality, we create an Excel file from the current data
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export for backward compatibility
export const exportToExcel = saveExcelFile;