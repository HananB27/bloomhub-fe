"use client";

import { Layers, Gift } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { PoliciesSubTab } from "./PoliciesSubTab";
import { BenefitsCatalogSubTab } from "./BenefitsCatalogSubTab";

export function AdminCompensationTab() {
  return (
    <Tabs defaultValue="policies" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="policies" className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          NET salary policies
        </TabsTrigger>
        <TabsTrigger value="benefits" className="flex items-center gap-2">
          <Gift className="h-4 w-4" />
          Benefits catalog
        </TabsTrigger>
      </TabsList>

      <TabsContent value="policies">
        <PoliciesSubTab />
      </TabsContent>

      <TabsContent value="benefits">
        <BenefitsCatalogSubTab />
      </TabsContent>
    </Tabs>
  );
}
