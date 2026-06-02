"use client";

import { Layers, Gift, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { PoliciesSubTab } from "./PoliciesSubTab";
import { BenefitsCatalogSubTab } from "./BenefitsCatalogSubTab";
import { CPFLevelsSubTab } from "./CPFLevelsSubTab";

export function AdminCompensationTab() {
  return (
    <Tabs defaultValue="policies" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="policies" className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          NET salary policies
        </TabsTrigger>
        <TabsTrigger value="cpf-levels" className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          CPF levels
        </TabsTrigger>
        <TabsTrigger value="benefits" className="flex items-center gap-2">
          <Gift className="h-4 w-4" />
          Benefits catalog
        </TabsTrigger>
      </TabsList>

      <TabsContent value="policies">
        <PoliciesSubTab />
      </TabsContent>

      <TabsContent value="cpf-levels">
        <CPFLevelsSubTab />
      </TabsContent>

      <TabsContent value="benefits">
        <BenefitsCatalogSubTab />
      </TabsContent>
    </Tabs>
  );
}
