use chrono::NaiveDateTime;

/// Serializes a `NaiveDateTime` as a `"YYYY-MM-DD HH:MM:SS"` string.
///
/// # Arguments
///
/// * `datetime` - The `NaiveDateTime` to serialize.
/// * `serializer` - The Serde serializer.
///
/// # Errors
///
/// Forwards Serde serialization errors.
pub fn naive_datetime_to_str<S>(datetime: &NaiveDateTime, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str(&datetime.format("%Y-%m-%d %H:%M:%S").to_string())
}

/// Parses a `"YYYY-MM-DD HH:MM:SS"` string and re-serializes it.
///
/// # Arguments
///
/// * `s` - The date-time string to parse and re-serialize.
/// * `serializer` - The Serde serializer.
///
/// # Errors
///
/// Returns a Serde error when the input string cannot be parsed as a
/// `NaiveDateTime`.
pub fn str_to_naive_datetime<S>(s: &str, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    let datetime = NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S")
        .map_err(|e| serde::ser::Error::custom(e.to_string()))?;
    serializer.serialize_str(&datetime.format("%Y-%m-%d %H:%M:%S").to_string())
}
