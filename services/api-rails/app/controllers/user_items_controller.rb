class UserItemsController < ActionController::API
  include Authenticatable

  before_action :find_item, only: %i[show update destroy]

  # I-6: reject any unknown body field on writes. Rails strong params silently
  # IGNORE unknown keys, so an explicit check is required to make "unknown
  # fields rejected" genuinely hold and return 400.
  before_action :reject_unknown_item_fields, only: %i[create update]

  # The only client-supplied fields allowed on an item write.
  PERMITTED_ITEM_KEYS = %w[title description].freeze

  # Rails-internal/request params that are never client item data.
  RESERVED_PARAM_KEYS = %w[controller action format id item].freeze

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

  # I-6: 400 when the request carries a field outside PERMITTED_ITEM_KEYS.
  # Looks under params[:item] when nested, otherwise the flat top-level params
  # (minus Rails-internal keys). Matches both shapes item_params accepts.
  def reject_unknown_item_fields
    supplied =
      if params[:item].respond_to?(:keys)
        params[:item].keys.map(&:to_s)
      else
        params.keys.map(&:to_s) - RESERVED_PARAM_KEYS
      end

    unknown = supplied - PERMITTED_ITEM_KEYS
    return if unknown.empty?

    render json: { error: "Unknown field(s): #{unknown.join(', ')}" },
           status: :bad_request
  end

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
