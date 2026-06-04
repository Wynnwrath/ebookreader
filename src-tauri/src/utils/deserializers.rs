use chrono::NaiveDateTime;
use serde::Deserialize;

/// Deserializes a `"YYYY-MM-DD HH:MM:SS"` string into a `NaiveDateTime`.
///
/// # Arguments
///
/// * `deserializer` - The Serde deserializer.
///
/// # Errors
///
/// Returns a Serde error when the input string cannot be parsed as a
/// `NaiveDateTime` in the expected format.
pub fn naive_datetime_from_str<'de, D>(deserializer: D) -> Result<NaiveDateTime, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let s: &str = Deserialize::deserialize(deserializer)?;
    NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S")
        .map_err(|e| serde::de::Error::custom(e.to_string()))
}
