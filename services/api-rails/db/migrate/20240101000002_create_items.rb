class CreateItems < ActiveRecord::Migration[8.0]
  def change
    create_table :items, id: :uuid do |t|
      t.string :title, null: false
      t.text :description
      t.references :user, null: false, foreign_key: true, type: :uuid

      t.timestamps
    end
  end
end
