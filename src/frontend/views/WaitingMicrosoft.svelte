<script lang="ts">
  import { ipcRenderer } from "electron";
  import { fade } from "svelte/transition";
  import { MSFT_OPCODE } from "../../common/MicrosoftType";

  ipcRenderer.send(MSFT_OPCODE.OPEN_LOGIN);
</script>

<div id="waitingContainer" class="absolute" in:fade="{{ delay: 500 }}" out:fade>
  <div id="waitingContent">
    <div class="waitingSpinner"></div>
    <div id="waitingTextContainer">
      <h2>Waiting for Microsoft..</h2>
    </div>
  </div>
</div>
