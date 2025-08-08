import { initializeConfig } from '../anchor_client';


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


// Account address to check balance for

Hooks.AdminWeb3Client= {
    mounted() {
        const seed = 12345;
        const fee = 100;
        const basisPoints = 500;       
        const initializeConfigButton = document.getElementById("admin-initialize-config")
        // Solana balance button
        if (initializeConfigButton) {
          this.el.addEventListener("click", async () => {
            await this.initializeConfig(seed, fee, basisPoints);
          });
        }
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
    async initializeConfig(seed, fee, basisPoints) {
      try {
          await initializeConfig(seed, fee, basisPoints);

      } catch (error) {
        console.error("❌ Error initializing config:", error);

        // Enhanced error logging
        if (error.cause) {
          console.error("Error cause:", error.cause);
        }
        if (error.logs) {
          console.error("Transaction logs:", error.logs);
        }

        throw error;

      }
    }
};
export default Hooks
