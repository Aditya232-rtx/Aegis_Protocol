{
  // 1. Context Extraction (data inputs only; nothing key-based or spent)
  // Watchers publish the bridge signal and oracle state as DATA INPUTS.
  val signalBox = CONTEXT.dataInputs(0)
  val oracleBox = CONTEXT.dataInputs(1)

  // 2. Data Decoding
  val reportedRisk = signalBox.R4[Int].get
  val ethPrice = oracleBox.R4[Long].get

  // 3. Logic Gates
  // Gate 0: Ensure the signal came from the approved Rosen Watcher script
  val expectedWatcherScript = SELF.R7[Coll[Byte]].get // stored in the box by governance
  val watcherAttested = signalBox.propositionBytes == expectedWatcherScript

  // Gate A: Bridge Signal Validation
  // Does the bridge report High Risk? (>= 80)
  val bridgeSignalValid = reportedRisk >= 80

  // Gate B: Oracle Sanity Check
  // Is the price actually crashing? (e.g., < $1500)
  val marketCrashConfirmed = ethPrice < 1500000000L // Scaled Long

  // Gate C: ZK Proof Verification (Simplified for Hackathon)
  // In production, this would verify a Sigma Protocol proof in R5
  val proof = signalBox.R5[GroupElement].get
  val isProofValid = proveDlog(proof)

  // Gate D: Destination Enforcement
  // The funds MUST go to the Rosen Bridge Vault to return to Ethereum.
  val vaultAddress = SELF.R6[Coll[Byte]].get
  val correctDestination = OUTPUTS(0).propositionBytes == vaultAddress

  // 4. Final Sigma Proposition
  sigmaProp(
    watcherAttested &&
    bridgeSignalValid &&
    marketCrashConfirmed &&
    isProofValid &&
    correctDestination
  )
}
