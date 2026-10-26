"use client";

/**
 * Recon's Browse view (`OperatorTreeView`): Sky Resources picked, its five
 * leases listed, Johnson A open to its four wells, and the Johnson A lease
 * dossier in the pane.
 */
import { OperatorTreeView } from "@/components/scout/operator-tree-view";
import { JOHNSON_A_KEY } from "@/lib/screens/recon-dossier-fixture";
import { RRC_LEASE_NO, SKY_OPERATOR_NO, SKY_P5_NAME } from "@/lib/screens/recon-rrc";
import { ScreenPanel } from "../../panel";

export function ReconBrowseScreen() {
  return (
    <ScreenPanel w={1280} h={760} path="/recon" pad={false}>
      <div className="relative h-full w-full">
        <OperatorTreeView
          initialOperator={{ operator_number: Number(SKY_OPERATOR_NO), operator_name: SKY_P5_NAME }}
          initialExpanded={[RRC_LEASE_NO["l-johnson"]]}
          initialLease={JOHNSON_A_KEY}
          onSelectOperator={() => {}}
          onSelectPrincipal={() => {}}
          onSelectLease={() => {}}
          onSelectWell={() => {}}
          onSelectOwner={() => {}}
        />
      </div>
    </ScreenPanel>
  );
}
