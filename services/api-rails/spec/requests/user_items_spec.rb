require 'rails_helper'

RSpec.describe UserItemsController, type: :request do
  let(:user) do
    User.create!(
      email: 'items-user@example.com',
      name: 'Items User',
      provider: 'github'
    )
  end

  let(:other_user) do
    User.create!(
      email: 'other@example.com',
      name: 'Other User',
      provider: 'github'
    )
  end

  let(:auth_headers) do
    token = JwtService.encode({ sub: user.id, email: user.email, name: user.name })
    { 'Authorization' => "Bearer #{token}" }
  end

  let!(:item) do
    user.items.create!(title: 'Existing Item', description: 'desc')
  end

  describe 'GET /items (index)' do
    it 'returns 401 without auth' do
      get '/items'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns only the current user items' do
      other_user.items.create!(title: 'Other item')
      get '/items', headers: auth_headers
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      ids = body['items'].map { |i| i['id'] }
      expect(ids).to include(item.id)
      expect(ids).not_to include(other_user.items.first.id)
    end
  end

  describe 'POST /items (create)' do
    it 'returns 401 without auth' do
      post '/items', params: { title: 'New' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'creates an item for current user' do
      post '/items',
        params: { title: 'New Item', description: 'Hello' },
        headers: auth_headers
      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body.dig('item', 'title')).to eq('New Item')
      expect(body.dig('item', 'user_id')).to eq(user.id)
    end

    it 'returns 422 when title is missing' do
      post '/items',
        params: { description: 'No title' },
        headers: auth_headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'GET /items/:id (show)' do
    it 'returns 401 without auth' do
      get "/items/#{item.id}"
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns the item for current user' do
      get "/items/#{item.id}", headers: auth_headers
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body.dig('item', 'id')).to eq(item.id)
    end

    it 'returns 404 for another user item' do
      other_item = other_user.items.create!(title: 'Other')
      get "/items/#{other_item.id}", headers: auth_headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'PATCH /items/:id (update)' do
    it 'returns 401 without auth' do
      patch "/items/#{item.id}", params: { title: 'Updated' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'updates the item' do
      patch "/items/#{item.id}",
        params: { title: 'Updated Title' },
        headers: auth_headers
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body.dig('item', 'title')).to eq('Updated Title')
    end

    it 'returns 404 for another user item' do
      other_item = other_user.items.create!(title: 'Other')
      patch "/items/#{other_item.id}",
        params: { title: 'Hijack' },
        headers: auth_headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'DELETE /items/:id (destroy)' do
    it 'returns 401 without auth' do
      delete "/items/#{item.id}"
      expect(response).to have_http_status(:unauthorized)
    end

    it 'deletes the item' do
      delete "/items/#{item.id}", headers: auth_headers
      expect(response).to have_http_status(:no_content)
      expect(Item.find_by(id: item.id)).to be_nil
    end

    it 'returns 404 for another user item' do
      other_item = other_user.items.create!(title: 'Other')
      delete "/items/#{other_item.id}", headers: auth_headers
      expect(response).to have_http_status(:not_found)
    end
  end
end
