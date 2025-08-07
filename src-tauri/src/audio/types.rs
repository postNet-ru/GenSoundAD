use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayingTime {
    pub start: DateTime<Local>,
    pub end: DateTime<Local>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cut {
    pub start: f64, // seconds
    pub end: f64,   // seconds
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Source {
    pub id: String,
    pub title: String,
    #[serde(rename = "typeId")]
    pub type_id: Option<String>,
    pub file_path: String, // Путь к файлу вместо Blob
    pub cut: Cut,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Arrangement {
    pub id: String,
    #[serde(rename = "typeId")]
    pub type_id: Option<String>,
    #[serde(rename = "playingTime")]
    pub playing_time: PlayingTime,
    pub loudness: Option<f32>,
    #[serde(rename = "fadeIn")]
    pub fade_in: bool,
    #[serde(rename = "fadeOut")]
    pub fade_out: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeOfRecord {
    pub start: DateTime<Local>,
    pub end: DateTime<Local>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportSettings {
    pub extension: String, // "mp3", "wav", "ogg", "flac"
    pub bitrate: u32,      // 128, 192, 320, etc.
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportRequest {
    pub sources: Vec<Source>,
    pub arrangements: std::collections::HashMap<String, Vec<Arrangement>>,
    pub time_of_records: std::collections::HashMap<String, TimeOfRecord>,
    pub settings: ExportSettings,
    pub record_name: String, // Какую запись экспортировать
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportProgress {
    pub stage: String, // "loading", "processing", "encoding", "completed", "error"
    pub progress: f32, // 0.0 - 100.0
    pub message: String,
    pub record_name: Option<String>,
}
