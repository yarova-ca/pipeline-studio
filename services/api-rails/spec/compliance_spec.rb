# Compliance catalog spec.
# Standalone — exercises the loader and profiles.json directly, no Rails
# boot and no database, so it runs even when the app cannot connect to a DB.
require 'json'
require_relative '../lib/compliance'

CATALOG_PATH = File.expand_path('../compliance/profiles.json', __dir__).freeze

RSpec.describe 'Compliance catalog' do
  let(:catalog) { JSON.parse(File.read(CATALOG_PATH)) }
  let(:profiles) { catalog['profiles'] }

  it 'every profile has the same control keys (uniformity)' do
    key_sets = profiles.transform_values { |p| p['controls'].keys.sort }
    reference = key_sets.values.first
    expect(reference).not_to be_empty

    key_sets.each do |name, keys|
      expect(keys).to eq(reference), "profile #{name} has different control keys"
    end
  end

  it 'itsg-33 pins data residency to canada and requires FIPS crypto' do
    itsg = profiles.fetch('itsg-33')
    expect(itsg['controls']['data_residency']).to eq('canada')
    expect(itsg['controls']['fips_crypto']).to eq(true)
  end

  it 'loader honours COMPLIANCE_PROFILE=itsg-33' do
    original = ENV['COMPLIANCE_PROFILE']
    ENV['COMPLIANCE_PROFILE'] = 'itsg-33'
    Compliance.reset!

    active = Compliance.active
    expect(active[:profile]).to eq('itsg-33')
    expect(active[:controls]['data_residency']).to eq('canada')
  ensure
    ENV['COMPLIANCE_PROFILE'] = original
    Compliance.reset!
  end
end
