defmodule AppWeb.Metrics do
  # I-13: golden-signal metrics in Prometheus text format.
  # An ETS table holds the request count, duration sum, and bucket counters.
  # ETS: Erlang's in-memory term store, shared across request processes.

  @buckets [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
  @table :http_metrics

  def setup do
    :ets.new(@table, [:named_table, :public, :set, write_concurrency: true])
    :ets.insert(@table, {:count, 0})
    :ets.insert(@table, {:sum, 0})
    Enum.each(@buckets, fn b -> :ets.insert(@table, {{:bucket, b}, 0}) end)
    :ok
  end

  # duration is in seconds.
  def observe(duration) do
    :ets.update_counter(@table, :count, {2, 1})
    # sum is stored in microseconds (integer) so update_counter stays atomic.
    :ets.update_counter(@table, :sum, {2, round(duration * 1_000_000)})
    Enum.each(@buckets, fn b ->
      if duration <= b, do: :ets.update_counter(@table, {:bucket, b}, {2, 1})
    end)
  end

  def render do
    [{:count, count}] = :ets.lookup(@table, :count)
    [{:sum, sum_us}] = :ets.lookup(@table, :sum)
    sum_s = sum_us / 1_000_000

    bucket_lines =
      Enum.map(@buckets, fn b ->
        [{_, v}] = :ets.lookup(@table, {:bucket, b})
        "http_request_duration_seconds_bucket{le=\"#{b}\"} #{v}"
      end)

    ([
       "# TYPE http_request_duration_seconds histogram"
     ] ++
       bucket_lines ++
       [
         "http_request_duration_seconds_bucket{le=\"+Inf\"} #{count}",
         "http_request_duration_seconds_sum #{sum_s}",
         "http_request_duration_seconds_count #{count}"
       ])
    |> Enum.join("\n")
  end
end
