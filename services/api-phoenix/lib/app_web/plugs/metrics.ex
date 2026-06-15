defmodule AppWeb.Plugs.Metrics do
  # Measures each request's wall-clock duration and records it (I-13).
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    start = System.monotonic_time()

    register_before_send(conn, fn conn ->
      micros = System.convert_time_unit(System.monotonic_time() - start, :native, :microsecond)
      AppWeb.Metrics.observe(micros / 1_000_000)
      conn
    end)
  end
end
