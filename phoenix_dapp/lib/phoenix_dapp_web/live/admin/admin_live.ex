defmodule PhoenixDappWeb.AdminLive do
  use PhoenixDappWeb, :live_view
  on_mount {PhoenixDappWeb.GlobalSettingsHook, :default}

  @stable_tokens [
    %{name: "USDC", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC"},
    %{name: "USDT", address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", symbol: "USDT"},
    %{name: "DAI", address: "EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCWNWqxWV4J6o", symbol: "DAI"},
    %{name: "PYUSD", address: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo", symbol: "PYUSD"}
  ]


  def mount(_params, _session, socket) do
    {:ok, assign(socket,

      # Config state
      config_initialized: false,
      fee_percentage: "2",
      config_loading: false,
      config_error: nil,
      config_success: nil,

      # Mint whitelist state
      stable_tokens: @stable_tokens,
      whitelisted_mints: [],
      custom_mint_address: "",
      selected_stable_token: nil,
      config_address: nil,
      mint_loading: false,
      mint_error: nil,
      mint_success: nil,

      # UI state
      dark_mode: false,
      locale: "en",

      active_tab: "config"
    )}
  end

  def handle_event("toggle_dark_mode", _params, socket) do
    {:noreply, assign(socket, dark_mode: !socket.assigns.dark_mode)}
  end

  def handle_event("change_locale", %{"locale" => locale}, socket) do
    {:noreply, assign(socket, locale: locale)}
  end

  def handle_event("switch_tab", %{"tab" => tab}, socket) do
    {:noreply, assign(socket, active_tab: tab)}
  end

  def handle_event("update_fee_percentage", %{"fee" => fee}, socket) do
    {:noreply, assign(socket, fee_percentage: fee)}

  end

  def handle_event("initialize_config", _params, socket) do
    socket = assign(socket, config_loading: true, config_error: nil, config_success: nil)
    socket = push_event(socket, "initialize-config", %{fee_percentage: socket.assigns.fee_percentage})
    {:noreply, socket}

  end


  def handle_event("select_stable_token", %{"token" => token_address}, socket) do
    selected_token = Enum.find(socket.assigns.stable_tokens, &(&1.address == token_address))
    {:noreply, assign(socket, selected_stable_token: selected_token)}
  end

  def handle_event("update_custom_mint", %{"mint" => mint_address}, socket) do
    {:noreply, assign(socket, custom_mint_address: mint_address)}
  end

  def handle_event("update_config_address", %{"config_address" => config}, socket) do
    {:noreply, assign(socket, config_address: config)}

  end

  def handle_event("add_stable_token", _params, socket) do
    if socket.assigns.selected_stable_token do
      socket = assign(socket, mint_loading: true, mint_error: nil, mint_success: nil)
      socket = push_event(socket, "add-stable-token", %{
          selected_stable_token: socket.assigns.selected_stable_token,
      })
      {:noreply, socket}
    else
      {:noreply, assign(socket, mint_error: t("admin.mint.select_token_error"))}
    end
  end

  def handle_event("add_custom_mint", _params, socket) do
    if String.length(socket.assigns.custom_mint_address) > 0 do
      socket = assign(socket, mint_loading: true, mint_error: nil, mint_success: nil)
      {:noreply, socket}
    else
      {:noreply, assign(socket, mint_error: t("admin.mint.invalid_address_error"))}
    end
  end

  def handle_event("remove_mint", %{"mint" => mint_address}, socket) do
    updated_mints = Enum.reject(socket.assigns.whitelisted_mints, &(&1.address == mint_address))

    {:noreply, assign(socket, whitelisted_mints: updated_mints)}
  end

  # Handle responses from JavaScript hooks
  def handle_event("config-initialized", %{"success" => true}, socket) do
    {:noreply, assign(socket,
      config_initialized: true,
      config_loading: false,
      config_success: t("admin.config.success")
    )}
  end

  def handle_event("config-initialized", %{"success" => false, "error" => error}, socket) do
    {:noreply, assign(socket,
      config_loading: false,
      config_error: error
    )}
  end

  def handle_event("mint-added", %{"success" => true, "mint" => mint_data}, socket) do
    new_mint = %{

      address: mint_data["address"],
      name: mint_data["name"] || "Custom Token",

      symbol: mint_data["symbol"] || "CUSTOM"
    }
    
    updated_mints = [new_mint | socket.assigns.whitelisted_mints]
    
    {:noreply, assign(socket,

      whitelisted_mints: updated_mints,
      mint_loading: false,
      mint_success: t("admin.mint.success"),
      custom_mint_address: "",
      selected_stable_token: nil
    )}

  end


  def handle_event("mint-added", %{"success" => false, "error" => error}, socket) do

    {:noreply, assign(socket,
      mint_loading: false,
      mint_error: error
    )}
  end

  defp t(key) do
    # Placeholder for translation function
    case key do
      "admin.title" -> "Admin Dashboard"
      "admin.config.tab" -> "Configuration"

      "admin.mint.tab" -> "Payment Methods"
      "admin.config.title" -> "Initialize Config"

      "admin.config.fee_label" -> "Fee Percentage (%)"
      "admin.config.button" -> "Initialize Config"
      "admin.config.success" -> "Configuration initialized successfully!"
      "admin.mint.title" -> "Payment Method Management"
      "admin.mint.stable_tokens" -> "Stable Tokens"
      "admin.mint.custom_mint" -> "Custom Mint Address"
      "admin.mint.add_stable" -> "Add Stable Token"
      "admin.mint.add_custom" -> "Add Custom Mint"
      "admin.mint.whitelisted" -> "Whitelisted Mints"
      "admin.mint.success" -> "Mint added successfully!"
      "admin.mint.select_token_error" -> "Please select a stable token first"
      "admin.mint.invalid_address_error" -> "Please enter a valid mint address"
      "admin.mint.remove" -> "Remove"
      "admin.mint.no_mints" -> "No whitelisted mints yet"
      # "admin.ui.dark_mode" -> "Dark Mode"
      # "admin.ui.language" -> "Language"
      _ -> key
    end

  end


  def render(assigns) do

    ~H"""
    <div class={[
      "min-h-screen transition-colors duration-200",

      if(@dark_mode, do: "bg-gray-900 text-white", else: "bg-gray-50 text-gray-900")
    ]}>
      <!-- Header -->
      <header class={[
        "border-b transition-colors duration-200",
        if(@dark_mode, do: "bg-gray-800 border-gray-700", else: "bg-white border-gray-200")
      ]}>
        <div class="container mx-auto px-4 py-4">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold"><%= t("admin.title") %></h1>
            

            <!-- UI Controls -->
            <div class="flex items-center gap-4">
              <!-- Language Selector -->
              <%!-- <select  --%>
              <%!--   phx-change="change_locale"  --%>
              <%!--   name="locale"  --%>
              <%!--   class={[ --%>
              <%!--     "px-3 py-1 rounded border transition-colors duration-200", --%>
              <%!--     if(@dark_mode,  --%>
              <%!--       do: "bg-gray-700 border-gray-600 text-white",  --%>
              <%!--       else: "bg-white border-gray-300 text-gray-900" --%>
              <%!--     ) --%>
              <%!--   ]} --%>
              <%!----%>
              <%!--   value={@locale} --%>
              <%!-- > --%>
              <%!----%>
              <%!--   <option value="en">English</option> --%>
              <%!--   <option value="es">Español</option> --%>
              <%!--   <option value="fr">Français</option> --%>
              <%!----%>
              <%!--   <option value="ar">العربية</option> --%>
              <%!-- </select> --%>


              <!-- Dark Mode Toggle -->
              <%!-- <button  --%>
              <%!--   phx-click="toggle_dark_mode" --%>
              <%!----%>
              <%!--   class={[ --%>
              <%!--     "p-2 rounded transition-colors duration-200", --%>
              <%!----%>
              <%!--     if(@dark_mode,  --%>
              <%!--       do: "bg-yellow-500 text-gray-900 hover:bg-yellow-400",  --%>
              <%!--       else: "bg-gray-800 text-white hover:bg-gray-700" --%>
              <%!--     ) --%>
              <%!--   ]} --%>
              <%!-- > --%>
              <%!--   <%= if @dark_mode do %> --%>
              <%!--     ☀️ --%>
              <%!--   <% else %> --%>
              <%!--     🌙 --%>
              <%!--   <% end %> --%>
              <%!-- </button> --%>
            </div>
          </div>
        </div>
      </header>

      <div class="container mx-auto px-4 py-6">
        <!-- Tabs -->
        <div class="mb-6">

          <nav class="flex space-x-1">
            <button 
              phx-click="switch_tab" 

              phx-value-tab="config"
              class={[
                "px-4 py-2 rounded-lg font-medium transition-colors duration-200",
                if(@active_tab == "config",
                  do: if(@dark_mode, do: "bg-blue-600 text-white", else: "bg-blue-500 text-white"),
                  else: if(@dark_mode, do: "bg-gray-700 text-gray-300 hover:bg-gray-600", else: "bg-gray-200 text-gray-700 hover:bg-gray-300")
                )
              ]}
            >
              <%= t("admin.config.tab") %>
            </button>
            
            <button 
              phx-click="switch_tab" 
              phx-value-tab="mint"
              class={[

                "px-4 py-2 rounded-lg font-medium transition-colors duration-200",
                if(@active_tab == "mint",

                  do: if(@dark_mode, do: "bg-blue-600 text-white", else: "bg-blue-500 text-white"),
                  else: if(@dark_mode, do: "bg-gray-700 text-gray-300 hover:bg-gray-600", else: "bg-gray-200 text-gray-700 hover:bg-gray-300")
                )
              ]}
            >
              <%= t("admin.mint.tab") %>
            </button>
          </nav>
        </div>

        <!-- Config Tab -->
        <div class={["#{if @active_tab != "config", do: "hidden"}"]}>
          <div class={[
            "rounded-lg p-6 transition-colors duration-200",
            if(@dark_mode, do: "bg-gray-800", else: "bg-white shadow-md")

          ]}>
            <h2 class="text-xl font-semibold mb-4"><%= t("admin.config.title") %></h2>
            

            <!-- Config Status -->
            <%= if @config_initialized do %>
              <div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                ✓ Configuration is initialized

              </div>
            <% end %>


            <!-- Error/Success Messages -->
            <%= if @config_error do %>
              <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <%= @config_error %>
              </div>
            <% end %>

            <%= if @config_success do %>
              <div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                <%= @config_success %>
              </div>
            <% end %>


            <!-- Fee Configuration -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">
                <%= t("admin.config.fee_label") %>
              </label>
              <input 

                type="number"
                step="0.1"
                min="0"
                max="100"
                phx-change="update_fee_percentage"
                name="fee"
                value={@fee_percentage}
                class={[
                  "w-32 px-3 py-2 border rounded-md transition-colors duration-200",
                  if(@dark_mode, 
                    do: "bg-gray-700 border-gray-600 text-white focus:border-blue-500", 
                    else: "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                  )
                ]}

              />
              <span class="ml-2 text-sm text-gray-500">%</span>
            </div>

            <!-- Initialize Button -->
            <button 
              phx-hook="AdminConfigHook"
              id="initialize-config-btn"
              phx-click="initialize_config"
              disabled={@config_loading}
              class={[
                "px-6 py-3 rounded-lg font-medium transition-colors duration-200",
                if(@config_loading,
                  do: "bg-gray-400 text-gray-600 cursor-not-allowed",
                  else: "bg-blue-500 text-white hover:bg-blue-600"

                )
              ]}
            >
              <%= if @config_loading do %>
                <span class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">

                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              <% else %>
                <%= t("admin.config.button") %>
              <% end %>
            </button>
          </div>

        </div>

        <!-- Mint Management Tab -->
        <div class={["#{if @active_tab != "mint", do: "hidden"}"]}>
          <div class={[
            "rounded-lg p-6 transition-colors duration-200",
            if(@dark_mode, do: "bg-gray-800", else: "bg-white shadow-md")
          ]}>
            <h2 class="text-xl font-semibold mb-4"><%= t("admin.mint.title") %></h2>

            <!-- Error/Success Messages -->
            <%= if @mint_error do %>

              <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <%= @mint_error %>
              </div>
            <% end %>

            <%= if @mint_success do %>
              <div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                <%= @mint_success %>
              </div>

            <% end %>

            <!-- Stable Tokens Section -->
            <div class="mb-6">
              <h3 class="text-lg font-medium mb-3"><%= t("admin.mint.stable_tokens") %></h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <%= for token <- @stable_tokens do %>
                  <button 

                    phx-click="select_stable_token"
                    phx-value-token={token.address}
                    class={[
                      "p-3 rounded-lg border transition-colors duration-200",
                      if(@selected_stable_token && @selected_stable_token.address == token.address,
                        do: if(@dark_mode, do: "bg-blue-600 border-blue-500 text-white", else: "bg-blue-500 border-blue-400 text-white"),
                        else: if(@dark_mode, do: "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600", else: "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100")
                      )

                    ]}
                  >
                    <div class="font-medium"><%= token.name %></div>
                    <div class="text-sm opacity-75"><%= token.symbol %></div>
                  </button>
                <% end %>
              </div>
              <div class="flex gap-3">
              <button 
                phx-hook="AdminMintHook"
                id="add-stable-token-btn"
                phx-click="add_stable_token"
                disabled={@mint_loading || !@selected_stable_token}
                class={[
                  "px-4 py-2 rounded-lg font-medium transition-colors duration-200",
                  if(@mint_loading || !@selected_stable_token,

                    do: "bg-gray-400 text-gray-600 cursor-not-allowed",
                    else: "bg-green-500 text-white hover:bg-green-600"
                  )
                ]}
              >
                <%= t("admin.mint.add_stable") %>
              </button>
            </div>

            <!-- Custom Mint Section -->
            <div class="mb-6">
              <h3 class="text-lg font-medium mb-3"><%= t("admin.mint.custom_mint") %></h3>
              <div class="flex gap-3">
                <input 
                  type="text"
                  phx-change="update_custom_mint"
                  name="mint"
                  value={@custom_mint_address}
                  placeholder="Enter mint address..."
                  class={[
                    "flex-1 px-3 py-2 border rounded-md transition-colors duration-200",
                    if(@dark_mode, 

                      do: "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500", 
                      else: "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                    )
                  ]}
                />
                </div>
                <button 
                  phx-hook="AdminMintHook"
                  id="add-custom-mint-btn"

                  phx-click="add_custom_mint"
                  disabled={@mint_loading || String.length(@custom_mint_address) == 0}
                  class={[
                    "px-4 py-2 rounded-lg font-medium transition-colors duration-200",
                    if(@mint_loading || String.length(@custom_mint_address) == 0,
                      do: "bg-gray-400 text-gray-600 cursor-not-allowed",

                      else: "bg-blue-500 text-white hover:bg-blue-600"
                    )
                  ]}
                >
                  <%= t("admin.mint.add_custom") %>
                </button>

              </div>
            </div>


            <!-- Whitelisted Mints -->
            <%!-- <div> --%>
            <%!--   <h3 class="text-lg font-medium mb-3"><%= t("admin.mint.whitelisted") %></h3> --%>
            <%!--   <%= if Enum.empty?(@whitelisted_mints) do %> --%>
            <%!--     <p class="text-gray-500 italic"><%= t("admin.mint.no_mints") %></p> --%>
            <%!--   <% else %> --%>
            <%!--     <div class="space-y-2"> --%>
            <%!--       <%= for mint <- @whitelisted_mints do %> --%>
            <%!--         <div class={[ --%>
            <%!--           "flex items-center justify-between p-3 rounded-lg border transition-colors duration-200", --%>
            <%!--           if(@dark_mode, do: "bg-gray-700 border-gray-600", else: "bg-gray-50 border-gray-200") --%>
            <%!--         ]}> --%>
            <%!--           <div> --%>
            <%!--             <div class="font-medium"><%= mint.name %> (<%= mint.symbol %>)</div> --%>
            <%!--             <div class="text-sm text-gray-500 font-mono"><%= mint.address %></div> --%>
            <%!--           </div> --%>
            <%!----%>
            <%!--           <button  --%>
            <%!--             phx-click="remove_mint" --%>
            <%!--             phx-value-mint={mint.address} --%>
            <%!--             class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200" --%>
            <%!--           > --%>
            <%!--             <%= t("admin.mint.remove") %> --%>
            <%!--           </button> --%>
            <%!--         </div> --%>
            <%!--       <% end %> --%>
            <%!--     </div> --%>
            <%!--   <% end %> --%>
            <%!-- </div> --%>
          </div>
        </div>
      </div>
    </div>
    """
  end
end

