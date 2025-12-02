use async_trait::async_trait;

#[async_trait]
pub trait Repository {
    type Item;
    type NewItem<'a>;
    type Form<'a>;
    type Id: Send + Sync;

    async fn get_all(&self) -> Result<Option<Vec<Self::Item>>, diesel::result::Error>;
    async fn get_by_id(&self, id: Self::Id) -> Result<Option<Self::Item>, diesel::result::Error>;
    async fn add<'a>(&self, item: Self::NewItem<'a>) -> Result<(), diesel::result::Error>;
    async fn update<'a>(
        &self,
        id: Self::Id,
        item: Self::Form<'a>,
    ) -> Result<(), diesel::result::Error>;
    async fn delete(&self, id: Self::Id) -> Result<(), diesel::result::Error>;
}
