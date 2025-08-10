defmodule PhoenixDappWeb.RootLayoutLive do
  use PhoenixDappWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket,
      locale: "en",
      dark_mode: false,
      # show_mobile_menu: false
    )}
  end


  def handle_event("change_locale", %{"locale" => locale}, socket) do
    {:noreply, assign(socket, locale: locale)}
  end

  def handle_event("toggle_dark_mode", _params, socket) do
    {:noreply, assign(socket, dark_mode: !socket.assigns.dark_mode)}
  end

  # def handle_event("toggle_mobile_menu", _params, socket) do
  #   {:noreply, assign(socket, show_mobile_menu: !socket.assigns.show_mobile_menu)}
  # end

  def render(assigns) do

    ~H"""
    <div class="min-h-screen flex flex-col">
      <%= @inner_content %>

    </div>
    """
  end
end

