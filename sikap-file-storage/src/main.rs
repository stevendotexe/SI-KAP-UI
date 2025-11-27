use axum::{routing::get, Router};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    // Router sederhana, cuma return text
    let app = Router::new().route("/", get(|| async { "Hello World! Docker WSL Berhasil Konek! 🐳" }));

    let addr = SocketAddr::from(([0, 0, 0, 0], 4000));
    println!("Server jalan di port 4000");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
