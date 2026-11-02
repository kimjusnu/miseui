import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/miseui/ui/tabs"

const PANEL_CLASS = "rounded-lg border p-4 text-sm text-muted-foreground"

export function Demo() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-sm">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className={PANEL_CLASS}>
        Status, owner and last change, all in one glance.
      </TabsContent>
      <TabsContent value="activity" className={PANEL_CLASS}>
        Twelve events this week, three of them from you.
      </TabsContent>
      <TabsContent value="settings" className={PANEL_CLASS}>
        Notifications, access and danger zone live here.
      </TabsContent>
    </Tabs>
  )
}
