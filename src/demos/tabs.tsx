import { Tabs, TabsContent, TabsList, TabsTrigger, type TabsEffect } from "@/registry/miseui/ui/tabs"

const PANEL_CLASS = "rounded-lg border p-4 text-sm text-muted-foreground"
const EFFECTS: readonly TabsEffect[] = ["spring", "pill"]

export function Demo() {
  return (
    <div className="grid w-full max-w-sm gap-6">
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
      <div className="flex flex-wrap gap-4">
        {EFFECTS.map((effect) => (
          <div key={effect} className="grid gap-1.5">
            <p className="text-xs text-muted-foreground">{effect}</p>
            <Tabs defaultValue="day" effect={effect}>
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        ))}
      </div>
    </div>
  )
}
