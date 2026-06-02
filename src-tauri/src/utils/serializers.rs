use chrono::NaiveDateTime;

pub fn naive_datetime_to_str<S>(datetime: &NaiveDateTime, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str(&datetime.format("%Y-%m-%d %H:%M:%S").to_string())
}

pub fn str_to_naive_datetime<S>(s: &str, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    let datetime = NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S")
        .map_err(|e| serde::ser::Error::custom(e.to_string()))?;
    serializer.serialize_str(&datetime.format("%Y-%m-%d %H:%M:%S").to_string())
}
