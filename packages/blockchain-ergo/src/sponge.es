{
  // Sponge Script (The Collateral)
  // Represents a user's collateral position on Ergo.
  // Can be spent by:
  // 1. The User (paying back debt - not implemented here for demo)
  // 2. The Backstop Pool (Seizure) IF Red Mode is active.

  // Use the PK stored in R4 of the box itself (Generic Template)
  val userPk = SELF.R4[GroupElement].get
  
  // Data Inputs references
  val signalBox = CONTEXT.dataInputs(0)
  val oracleBox = CONTEXT.dataInputs(1)

  // Crisis Condition
  val riskScore = signalBox.R4[Int].get
  val ethPrice = oracleBox.R4[Long].get
  
  // Match Guard Script Logic: Price < 1500 * 10^6 (scaled long)
  val isCrisis = (riskScore >= 80) && (ethPrice < 1500000000L)

  // Spend Conditions
  // A: Normal User Spend (Signature)
  val userSign = proveDlog(userPk)
  
  // B: Crisis Seizure (Script Logic)
  // If crisis, allow this box to be consumed (seized) by the transaction.
  // CRITICAL: Must ensure the Output Box sets R4 (Address) for Rosen Bridge routing.
  val validAddressing = OUTPUTS(0).R4[Coll[Byte]].isDefined
  val crisisUnlock = isCrisis && validAddressing

  userSign || crisisUnlock
}
