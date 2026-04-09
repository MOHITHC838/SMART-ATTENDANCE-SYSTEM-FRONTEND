// Mock data for testing
export const mockStudents = [
  {
    id: 1,
    name: 'John Doe',
    registerNumber: '2021001',
    dept: 'Computer Science',
    section: 'B',
    email: 'john@college.edu',
    phone: '1234567890',
    attendance: {
      1: true,
      2: true,
      3: true,
      4: true,
      5: false,
      6: false
    }
  },
  {
    id: 2,
    name: 'Jane Smith',
    registerNumber: '2021002',
    dept: 'Computer Science',
    section: 'B',
    email: 'jane@college.edu',
    phone: '1234567891',
    attendance: {
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
      6: false
    }
  }
];

export const mockFaculty = {
  id: 1,
  name: 'Dr. Johnson',
  facultyId: 'FAC001',
  dept: 'Computer Science',
  email: 'johnson@college.edu',
  phone: '9876543210'
};

export const mockAttendanceData = {
  totalStudents: 30,
  present: 25,
  absent: 5,
  byHour: {
    1: { present: 28, absent: 2 },
    2: { present: 27, absent: 3 },
    3: { present: 26, absent: 4 },
    4: { present: 25, absent: 5 },
    5: { present: 24, absent: 6 },
    6: { present: 23, absent: 7 }
  }
};

export const mockODRequests = [
  {
    id: 1,
    studentName: 'John Doe',
    registerNumber: '2021001',
    date: '2024-01-15',
    hour: 3,
    category: 'od',
    reason: 'Sports event',
    status: 'pending',
    submittedDate: '2024-01-14'
  },
  {
    id: 2,
    studentName: 'Jane Smith',
    registerNumber: '2021002',
    date: '2024-01-15',
    hour: 4,
    category: 'permission',
    reason: 'Medical appointment',
    status: 'approved',
    submittedDate: '2024-01-13'
  }
];