import { apiClient } from "@/lib/axios";

export interface UploadResponse {
  url: string;
  filename: string;
  content_type?: string;
  size?: number;
}

export const uploadApi = {
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{ data: UploadResponse }>("/uploads/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },
  upload: async (file: File): Promise<UploadResponse> => {
    return uploadApi.uploadImage(file);
  },
};
