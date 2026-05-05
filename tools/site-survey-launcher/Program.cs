using System.Diagnostics;
using System.Windows.Forms;

var repoRoot = @"C:\Users\mpsap\Downloads\1\Data-Exporter";
var command = "set \"CI=true\" && pnpm install && set \"PORT=5173\" && set \"BASE_PATH=/\" && pnpm --filter @workspace/site-survey run dev";

var startInfo = new ProcessStartInfo
{
    FileName = "cmd.exe",
    Arguments = $"/k \"cd /d \"\"{repoRoot}\"\" && {command}\"",
    UseShellExecute = true,
    WorkingDirectory = repoRoot
};

try
{
    Process.Start(startInfo);
}
catch (Exception ex)
{
    MessageBox.Show(
        $"Failed to start the local website.\n\n{ex.Message}",
        "Site Survey Launcher",
        MessageBoxButtons.OK,
        MessageBoxIcon.Error
    );
}
