use axum::{
    body::Body,
    extract::{Path, Request},
};
use tempfile::tempdir;
use tower::ServiceExt;

use sikap_file_storage::config::AppConfig;
use sikap_file_storage::handlers::delete::delete_file;
use sikap_file_storage::utils::auth::auth_middleware;

#[tokio::test]
async fn delete_file_removes_existing_file() {
    let dir = tempdir().unwrap();
    let upload_dir = dir.path().to_string_lossy().to_string();

    let file_path = dir.path().join("test.txt");
    tokio::fs::write(&file_path, b"hello").await.unwrap();

    let cfg = AppConfig {
        upload_dir: upload_dir.clone(),
        api_secret: "secret".to_string(),
        port: 0,
    };

    let axum::response::Json(v) = delete_file(
        axum::extract::State(cfg.clone()),
        Path("test.txt".to_string()),
    )
    .await;
    assert_eq!(v["status"], "success");
    assert!(!file_path.exists());
}

#[tokio::test]
async fn auth_middleware_rejects_wrong_key() {
    let cfg = AppConfig {
        upload_dir: "./uploads".to_string(),
        api_secret: "secret".to_string(),
        port: 0,
    };

    let app = axum::Router::new()
        .route("/", axum::routing::get(|| async { "ok" }))
        .route_layer(axum::middleware::from_fn_with_state(
            cfg.clone(),
            auth_middleware,
        ))
        .with_state(cfg.clone());

    let req = Request::builder().uri("/").body(Body::empty()).unwrap();
    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), axum::http::StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn auth_middleware_accepts_correct_key() {
    let cfg = AppConfig {
        upload_dir: "./uploads".to_string(),
        api_secret: "secret".to_string(),
        port: 0,
    };

    let app = axum::Router::new()
        .route("/", axum::routing::get(|| async { "ok" }))
        .route_layer(axum::middleware::from_fn_with_state(
            cfg.clone(),
            auth_middleware,
        ))
        .with_state(cfg.clone());

    let req = Request::builder()
        .uri("/")
        .header("x-api-key", "secret")
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), axum::http::StatusCode::OK);
}
