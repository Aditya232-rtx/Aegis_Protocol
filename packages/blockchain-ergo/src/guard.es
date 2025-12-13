{
  // 1. Context Extraction
  // We look at the first input which contains the Bridge Signal
  val signalBox = INPUTS(0)
  // We look at the second input which is the Oracle Pool Box
  val oracleBox = INPUTS(1)

  // 2. Data Decoding
  val reportedRisk = signalBox.R4[Int].get
  val ethPrice = oracleBox.R4[Long].get

  // 3. Logic Gates
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
  sigmaProp(bridgeSignalValid && marketCrashConfirmed && isProofValid && correctDestination)
}
