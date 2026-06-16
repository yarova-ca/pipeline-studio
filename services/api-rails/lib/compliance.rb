# Industry compliance profile, read at startup.
# One repo serves every industry; COMPLIANCE_PROFILE picks one of the
# generated profiles in compliance/profiles.json. The controls flip at
# boot, no rebuild.
require 'json'

module Compliance
  CATALOG_FILE = 'profiles.json'.freeze

  def self.active
    @active ||= load_profile
  end

  # Test hook — drop the memoized profile so a new ENV value is picked up.
  def self.reset!
    @active = nil
  end

  def self.catalog_path
    base = defined?(Rails) && Rails.respond_to?(:root) && Rails.root ? Rails.root.to_s : Dir.pwd
    candidate = File.join(base, 'compliance', CATALOG_FILE)
    return candidate if File.exist?(candidate)

    # Fall back to the working directory when not running under Rails.
    File.join(Dir.pwd, 'compliance', CATALOG_FILE)
  end

  def self.load_catalog
    path = catalog_path
    JSON.parse(File.read(path))
  rescue StandardError => e
    warn "FATAL: compliance catalog not loadable: #{path}: #{e.message}"
    exit 1
  end

  def self.load_profile
    name = ENV['COMPLIANCE_PROFILE'] || 'baseline'
    catalog = load_catalog
    profiles = catalog['profiles'] || {}

    entry = profiles[name]
    unless entry
      warn "FATAL: unknown COMPLIANCE_PROFILE: #{name}"
      exit 1
    end

    {
      profile: name,
      name: entry['name'],
      jurisdiction: entry['jurisdiction'],
      controls: entry['controls'] || {}
    }
  end
end
