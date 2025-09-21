const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API_URLS = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  profile: `${API_BASE_URL}/auth/profile`,
  getAllUsers: `${API_BASE_URL}/admin/users`,
  updateUser: `${API_BASE_URL}/admin/users`,
  createUser: `${API_BASE_URL}/admin/users`,
  getAllTests: `${API_BASE_URL}/material-test/all`,
  getTestDetails: `${API_BASE_URL}/material-test`,
  getPendingReports: `${API_BASE_URL}/material-test/reports/pending-approval`,
  getAllClients: `${API_BASE_URL}/receptionist/clients`,
  deleteClient: `${API_BASE_URL}/receptionist/clients`,
  createClient: `${API_BASE_URL}/receptionist/clients`,
  updateClient: `${API_BASE_URL}/receptionist/clients`,
  getClientDetails: (id) => `${API_BASE_URL}/receptionist/clients/${id}`,
  getTestScope: `${API_BASE_URL}/receptionist/test-scope`,
  getTestById: (id) => `${API_BASE_URL}/material-test/${id}`,
  TESTS: `${API_BASE_URL}/material-test`,
  getTestStandards: `${API_BASE_URL}/receptionist/test-scope`,
  updateTestStatus: (id) => `${API_BASE_URL}/material-test/${id}/status`,
  saveReport: (id) => `${API_BASE_URL}/material-test/${id}/report`,
  approveIndividualReport: (id) => `${API_BASE_URL}/material-test/${id}/report/approve-individual`,
  rejectIndividualReport: (id) => `${API_BASE_URL}/material-test/${id}/report/reject-individual`,
  generateROR: `${API_BASE_URL}/ror/generate`,
  generateProforma: `${API_BASE_URL}/proforma/generate`,
  createProforma: `${API_BASE_URL}/proforma/create`,
  getReportById: `${API_BASE_URL}/material-test/report`,
  getReportByAtlId: `${API_BASE_URL}/material-test/report-by-atlid`,
  forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
  verifyOTP: `${API_BASE_URL}/auth/verify-otp`,
  resetPassword: `${API_BASE_URL}/auth/reset-password`,
  getAllEquipments: `${API_BASE_URL}/shead/equipments`,
  createEquipment: `${API_BASE_URL}/shead/equipments`,
  updateEquipment: `${API_BASE_URL}/shead/equipments`,
  deleteEquipment: `${API_BASE_URL}/shead/equipments`,
  getReceptionistStats: `${API_BASE_URL}/receptionist/stats`,
  getSuperadminStats: `${API_BASE_URL}/admin/stats`,
  getTestTypeMonthlyStats: `${API_BASE_URL}/admin/test-type-monthly-stats`,
  getAllEquipment: `${API_BASE_URL}/equipment`,
  getEquipmentByIds: `${API_BASE_URL}/equipment/byIds`,
  getClientById: (id) => `${API_BASE_URL}/receptionist/clients/${id}`,
  createMaterialTest: `${API_BASE_URL}/material-test/create`,
  checkEmail: `${API_BASE_URL}/auth/check-email`,
  sendOTP: `${API_BASE_URL}/auth/send-otp`,
  updatePassword: `${API_BASE_URL}/auth/update-password`,
  deleteProforma: `${API_BASE_URL}/proforma`,
  sendTestDocuments: `${API_BASE_URL}/receptionist/send-documents`,
  generateJobCard: (id) => `${API_BASE_URL}/material-test/${id}/jobcard`,
  sendJobCardForApproval: (id) =>
    `${API_BASE_URL}/material-test/${id}/jobcard/send`,
  approveJobCard: (id) => `${API_BASE_URL}/material-test/${id}/jobcard/approve`,
  getLastAtlId: `${API_BASE_URL}/material-test/lastAtlId`,
  sendTestValuesForApproval: (id) =>
    `${API_BASE_URL}/material-test/${id}/test-values/send`,
  uploadTestReport: (id) => `${API_BASE_URL}/material-test/${id}/report`,
  sendForApproval: (id) =>
    `${API_BASE_URL}/material-test/${id}/send-for-approval`,
  approveResults: (id) => `${API_BASE_URL}/material-test/${id}/approve-results`,
  rejectResults: (id) => `${API_BASE_URL}/material-test/${id}/reject-results`,
  sendReportForApproval: (id) =>
    `${API_BASE_URL}/material-test/${id}/report/send-for-approval`,
  approveReport: (id) => `${API_BASE_URL}/material-test/${id}/report/approve`,
  rejectReport: (id) => `${API_BASE_URL}/material-test/${id}/report/reject`,
  editReport: (id) => `${API_BASE_URL}/material-test/${id}/report/edit`,
  sendIndividualReportForApproval: (id) => `${API_BASE_URL}/material-test/${id}/report/send-individual`,
  getSectionHeadStats: `${API_BASE_URL}/sectionhead/stats`,
  getSectionHeadMonthlyStats: `${API_BASE_URL}/sectionhead/monthly-stats`,
};

export const apiRequest = async (url, options = {}) => {
  try {
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
      }

      throw {
        status: response.status,
        message: data.error || data.message || "Request failed",
        field: data.field,
      };
    }

    return { ...data, ok: true };
  } catch (error) {
    throw error;
  }
};
