# STAGE 1: Builder
FROM rust:1-slim-bookworm as builder
WORKDIR /app

# 1. Copy Cargo.toml DAN Cargo.lock dulu (tanpa source code)
COPY Cargo.toml Cargo.lock ./

# 2. Bikin "Hello World" palsu biar bisa dicompile
# Ini trik biar library (dependencies) ke-cache sama Docker
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release

# 3. Sekarang baru copy Source Code
COPY . .

# 4. Hapus artifact build palsu tadi, terus build beneran
# 'touch' main.rs biar compiler tau filenya berubah
RUN touch src/main.rs
RUN cargo build --release

# STAGE 2: Runner (Sama aja kayak sebelumnya)
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/sikap-file-storage .
EXPOSE 4000
CMD ["./sikap-file-storage"]
