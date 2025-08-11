import { setMintAsPayment, initializeConfig } from '../anchor_client';


const Hooks = {};
Hooks.Counter = {
  mounted() {
    // const button = document.getElementById("js-button")
    
    this.el.addEventListener("click", () => {
      const message = `Hello from JavaScript! Timestamp: ${new Date().toISOString()}`
      
      // Send message to LiveView
      this.pushEvent("js-message", { message })
      
      // Also manipulate DOM directly if needed
      console.log("Button clicked, message sent to LiveView")
    })
    
    // You can also listen to events from LiveView
    this.handleEvent("counter-updated", ({ count }) => {
      console.log(`Counter updated to ${count}`)
    })
  }
};

Hooks.AdminMintHook = {
    mounted() {
        this.handleEvent("add-stable-token", ({config_address, selected_stable_token}) => {
            this.setMintAsPayment(config_address, selected_stable_token.address);
        });
    },
    async setMintAsPayment(configAddress, mintAddress) {
        console.log(mintAddress);
      try {
          setMintAsPayment(mintAddress);
          this.pushEvent("mint-added", {success: true });

      } catch (error) {
        console.error("❌ Error initializing config:", error);

        // Enhanced error logging
        if (error.cause) {
          console.error("Error cause:", error.cause);
        }
        if (error.logs) {
          console.error("Transaction logs:", error.logs);
        }
        this.pushEvent("mint-added", {success: false, error});

        throw error;

      }
    }


};


// Account address to check balance for

Hooks.AdminConfigHook = {
    mounted() {
        const basisPoints = 10000;       
        // const initializeConfigButton = document.getElementById("admin-initialize-config-btn")
        // Solana balance button
        this.handleEvent("initialize-config", ({fee_percentage}) => {
            this.initializeConfig( fee_percentage * basisPoints/100, basisPoints);
        });
    },

    async getAccountBalance(accountAddress) {

      try {
        // Get account info which includes lamports (balance)
        const { value: accountInfo } = await this.rpc.getAccountInfo(accountAddress).send();

        if (!accountInfo) {
          console.log("Account not found or has no data");
          return null;
        }

        // Balance in lamports (1 SOL = 1,000,000,000 lamports)

        const lamports = accountInfo.lamports;
        const solBalance = Number(lamports) / 1_000_000_000;

        console.log(`Account: ${accountAddress}`);
        console.log(`Balance: ${lamports} lamports`);
        console.log(`Balance: ${solBalance} SOL`);

        return {
          lamports,

          sol: solBalance,
          accountInfo
        };

      } catch (error) {
        console.error("Error fetching account balance:", error);

        throw error;
      }
    },
    async initializeConfig( fee, basisPoints) {
      try {
          await initializeConfig( fee, basisPoints);
          this.pushEvent("config-initialized", {success: true });

      } catch (error) {
        console.error("❌ Error initializing config:", error);

        // Enhanced error logging
        if (error.cause) {
          console.error("Error cause:", error.cause);
        }
        if (error.logs) {
          console.error("Transaction logs:", error.logs);
        }
        this.pushEvent("config-initialized", {success: false, error});

        throw error;

      }
    }
};
export default Hooks
