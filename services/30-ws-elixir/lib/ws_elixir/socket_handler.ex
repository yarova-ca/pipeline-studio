defmodule WsElixir.SocketHandler do
  @behaviour :cowboy_websocket

  def init(req, state), do: {:cowboy_websocket, req, state}
  def websocket_init(state), do: {:ok, state}

  def websocket_handle({:text, msg}, state) do
    {:reply, {:text, Jason.encode!(%{echo: msg})}, state}
  end
  def websocket_handle(_frame, state), do: {:ok, state}
  def websocket_info(_info, state), do: {:ok, state}
end
