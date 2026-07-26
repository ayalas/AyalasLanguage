$serverIP      = "[2a0f:f01:208:7e7::]"
$sshKeyPath    = "C:\Users\ayala\.ssh\id_ed25519"
$targetDir     = "/langapp-stack"

scp -i $sshKeyPath ./langapp-stack/Caddyfile admin@${serverIP}:${targetDir}/Caddyfile
if (Test-Path ./langapp-stack/certs) {
    scp -i $sshKeyPath -r ./langapp-stack/certs admin@${serverIP}:${targetDir}
}