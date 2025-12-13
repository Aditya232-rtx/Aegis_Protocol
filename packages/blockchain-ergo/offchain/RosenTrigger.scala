package offchain

// Mock for Rosen Bridge Trigger
object RosenTrigger {
    case class MockBox(id: String, registers: Map[String, Any])

    // Simulates the Bridge watching the EVM event and creating a box on Ergo
    // Logic: Mint a 'Signal' token or set specific registers
    def createSignalBox(riskScore: Int): MockBox = {
        // R4: Risk Score (Int)
        // R5: Governer Address (Coll[Byte]) - Placeholder
        MockBox(
            id = "bridge_signal_box_id_" + java.util.UUID.randomUUID.toString.substring(0, 8),
            registers = Map(
                "R4" -> riskScore,
                "R5" -> "MockGroupElement_PK_12345" // Simulates public key for proveDlog
            )
        )
    }

    def createOracleBox(price: Long): MockBox = {
        // R4: ETH Price (Long)
        // R5: Timestamp (Long)
        MockBox(
            id = "oracle_box_id_" + java.util.UUID.randomUUID.toString.substring(0, 8),
            registers = Map(
                "R4" -> price,
                "R5" -> System.currentTimeMillis()
            )
        )
    }
}
