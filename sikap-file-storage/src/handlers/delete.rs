use axum::{
    extract::{Path, State},
    response::Json,
};
use serde_json::Value;
use serde_json::json;
use std::path::Path as StdPath;
use tokio::fs;

use crate::config::AppConfig;

/// Deletes a file by its name in the configured upload directory.
///
/// The `filename` is sanitized to prevent directory traversal (only the file name segment is used).
///
/// Example:
/// ```bash
/// curl -X DELETE \
///   -H "x-api-key: <SECRET>" \
///   http://localhost:4000/file/example.webp
/// ```
pub async fn delete_file(
    State(config): State<AppConfig>,
    Path(filename): Path<String>,
) -> Json<Value> {
    let upload_dir = &config.upload_dir;

    // Sanitasi filename biar gak kena directory traversal (../../)
    let safe_filename = StdPath::new(&filename).file_name();

    if let Some(name) = safe_filename {
        // Combine configured path with the sanitized file name
        let filepath = StdPath::new(upload_dir).join(name);

        // Hapus file
        match fs::remove_file(filepath).await {
            Ok(_) => Json(json!({
                "status": "success",
                "message": "File deleted",
                "filename": filename
            })),
            Err(_) => Json(json!({
                "status": "error",
                "message": "File not found or could not be deleted"
            })),
        }
    } else {
        Json(json!({
            "status": "error",
            "message": "Invalid filename format"
        }))
    }
}
