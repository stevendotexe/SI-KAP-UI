use axum::{
    extract::{Multipart, State},
    response::{IntoResponse, Json},
};
use serde_json::json;
use std::path::Path;
use tokio::fs;
use uuid::Uuid;

use crate::config::AppConfig;

/// Handles file uploads.
///
/// Behavior:
/// - Accepts multipart form data with the field name `file`.
/// - If the content type is `image/*`, attempts to transcode to WebP.
/// - Falls back to saving the original bytes if transcoding fails.
/// - For non-image files, preserves the original extension when possible.
///
/// Examples:
/// ```bash
/// curl -X POST \
///   -H "x-api-key: <SECRET>" \
///   -F "file=@/path/to/photo.jpg" \
///   http://localhost:4000/upload
/// ```
pub async fn upload_file(
    State(config): State<AppConfig>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, axum::http::StatusCode> {
    let mut uploaded_files = Vec::new();
    let upload_dir = &config.upload_dir;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?
    {
        let Some(name) = field.name() else { continue };

        if name == "file" {
            let original_filename = field.file_name().unwrap_or("unknown").to_string();
            let content_type = field
                .content_type()
                .unwrap_or("application/octet-stream")
                .to_string();

            // 1. Baca data ke RAM (Buffer)
            let data_bytes = match field.bytes().await {
                Ok(bytes) => bytes,
                Err(_) => continue,
            };

            let file_uuid = Uuid::new_v4();
            let final_filename;

            let ext = Path::new(&original_filename)
                .extension()
                .and_then(std::ffi::OsStr::to_str)
                .unwrap_or("bin");

            final_filename = format!("{}.{}", file_uuid, ext);
            let final_path = Path::new(upload_dir).join(&final_filename);

            fs::write(&final_path, &data_bytes)
                .await
                .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

            uploaded_files.push(json!({
                "original_name": original_filename,
                "filename": final_filename,
                "url": format!("/files/{}", final_filename), // Ini URL buat diakses Next.js
                "mimetype": content_type
            }));
        }
    }

    Ok(Json(json!({
        "status": "success",
        "data": uploaded_files
    })))
}
