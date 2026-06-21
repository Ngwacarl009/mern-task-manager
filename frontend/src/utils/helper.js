export const getPriorityColor = (priority) => {
  switch (priority) {
    case "High":
      return "badge-high";
    case "Medium":
      return "badge-medium";
    case "Low":
      return "badge-low";
    default:
      return "badge-low";
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case "Pending":
      return "badge-pending";
    case "In Progress":
      return "badge-progress";
    case "Completed":
      return "badge-completed";
    default:
      return "badge-pending";
  }
};

export const addThousandsSeparator = (num) => {
  if (num === null || num === undefined) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const downloadBlob = (data, filename) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
