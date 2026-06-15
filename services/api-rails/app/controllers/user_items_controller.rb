class UserItemsController < ActionController::API
  include Authenticatable

  before_action :find_item, only: %i[show update destroy]

  # GET /items — list all items for current user
  def index
    items = @current_user.items.order(created_at: :desc)
    render json: { items: items.map { |i| item_json(i) } }
  end

  # POST /items — create item for current user
  def create
    item = @current_user.items.build(item_params)

    if item.save
      render json: { item: item_json(item) }, status: :created
    else
      render json: { errors: item.errors.as_json }, status: :unprocessable_entity
    end
  end

  # GET /items/:id — show one item (scoped to current user)
  def show
    render json: { item: item_json(@item) }
  end

  # PATCH/PUT /items/:id — update item (scoped to current user)
  def update
    if @item.update(item_params)
      render json: { item: item_json(@item) }
    else
      render json: { errors: @item.errors.as_json }, status: :unprocessable_entity
    end
  end

  # DELETE /items/:id — delete item (scoped to current user)
  def destroy
    @item.destroy!
    head :no_content
  end

  private

  def find_item
    @item = @current_user.items.find_by(id: params[:id])
    render json: { error: 'Item not found' }, status: :not_found unless @item
  end

  def item_params
    params.require(:item).permit(:title, :description)
  rescue ActionController::ParameterMissing
    params.permit(:title, :description)
  end

  def item_json(item)
    {
      id: item.id,
      title: item.title,
      description: item.description,
      user_id: item.user_id,
      created_at: item.created_at,
      updated_at: item.updated_at
    }
  end
end
