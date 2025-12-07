export type UploadItem = {
  original_name: string;
  filename: string;
  url: string;
  mimetype: string;
};

export type UploadResponse = {
  status: "success";
  data: UploadItem[];
};

export type DeleteResponse = {
  status: "success" | "error";
  message: string;
  filename?: string;
};

export type OwnerType =
  | "task"
  | "report"
  | "final_report"
  | "assessment"
  | "attendance_log"
  | "calendar_event";
