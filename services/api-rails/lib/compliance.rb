# Industry compliance profile, read at startup.
# One repo serves every industry; COMPLIANCE_PROFILE flips a few controls.
require 'yaml'

module Compliance
  VALID = %w[baseline hipaa pci fedramp fips pipeda].freeze

  def self.active
    @active ||= load_profile
  end

  def self.load_profile
    profile = (ENV['COMPLIANCE_PROFILE'] || 'baseline').downcase
    unless VALID.include?(profile)
      warn "FATAL: unknown COMPLIANCE_PROFILE: #{profile}"
      exit 1
    end

    c = {
      profile: profile,
      audit_logging: false,
      session_timeout_seconds: 8 * 60 * 60,
      mfa_required: false,
      encryption_in_transit: false,
      required: {}
    }
    return c if profile == 'baseline'

    path = File.join(Dir.pwd, 'compliance', "#{profile}.yaml")
    begin
      doc = YAML.safe_load(File.read(path))
    rescue StandardError => e
      # A named profile with no readable file must fail loud.
      warn "FATAL: compliance profile not loadable: #{profile}: #{e.message}"
      exit 1
    end

    (doc['required_controls'] || []).each do |entry|
      entry.each do |k, v|
        c[:required][k] = v
        case k
        when 'audit_logging' then c[:audit_logging] = v == true
        when 'mfa_required' then c[:mfa_required] = v == true
        when 'encryption_in_transit' then c[:encryption_in_transit] = v == true
        when 'session_timeout' then c[:session_timeout_seconds] = v.to_i if v
        end
      end
    end
    c
  end
end
