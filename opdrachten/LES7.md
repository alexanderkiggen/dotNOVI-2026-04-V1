# Les 7: Infrastructure as Code met Terraform

## Doelstellingen

In deze les leer je:
- Wat Infrastructure as Code (IaC) is en waarom het bestaat
- Het verschil tussen ClickOps en IaC
- Terraform concepten: providers, resources, state, variables
- HCL syntax lezen en schrijven
- De Terraform workflow: init → plan → apply → destroy
- Terraform toepassen op Kubernetes (minikube)

## Wat is IaC?

### Het probleem: ClickOps & Snowflake Servers

Handmatig configureren via GUI leidt tot:
- **Snowflake servers**: geen twee zijn hetzelfde
- **Niet reproduceerbaar**: "hoe had ik die server ook alweer geconfigureerd?"
- **Niet reviewbaar**: geen Pull Requests voor infrastructuur
- **Niet gedocumenteerd**: kennis zit in iemands hoofd

### De oplossing: Infrastructure as Code

```
Principes:
- Declaratief: beschrijf WAT je wilt, niet HOE
- Versiebeheerd: in Git, net als applicatiecode
- Idempotent: meerdere keren uitvoeren = zelfde resultaat
- Reviewbaar: infra-changes via Pull Request
```

## Terraform Concepten

### Provider

Een plugin die Terraform verbindt met een platform:

```hcl
provider "kubernetes" {
  config_path = "~/.kube/config"
}
```

Populaire providers: kubernetes, aws, azurerm, google, github

### Resource

Een stuk infrastructuur dat Terraform beheert:

```hcl
resource "kubernetes_deployment" "dotnovi" {
  metadata {
    name = "dotnovi"
  }
  spec {
    replicas = var.replicas
    # ...
  }
}
```

### State

Terraform's geheugen: `terraform.tfstate`
- Houdt bij welke resources bestaan
- Mapping tussen code en echte infrastructuur
- **NOOIT** handmatig aanpassen
- **NOOIT** in Git committen (bevat gevoelige data)

### Variables & Outputs

```hcl
variable "replicas" {
  type    = number
  default = 2
}

output "service_port" {
  value = kubernetes_service.dotnovi.spec[0].port[0].node_port
}
```

## Terraform Workflow

```bash
# 1. Providers downloaden
terraform init

# 2. Bekijk wat er gaat veranderen (dry-run)
terraform plan

# 3. Voer de veranderingen door
terraform apply

# 4. Alles opruimen
terraform destroy
```

### Plan output lezen

```
+ = resource wordt aangemaakt
- = resource wordt verwijderd
~ = resource wordt gewijzigd
-/+ = resource wordt vervangen

Plan: 2 to add, 0 to change, 0 to destroy.
```

## Opdrachten

### Opdracht 1: Terraform init

```bash
# Maak een terraform/ directory
mkdir terraform && cd terraform

# Schrijf main.tf met kubernetes provider (https://gist.github.com/erikkasimier/e3eb7755697d0d500f673ff5d4477b9c)

# Initialiseer Terraform
terraform init
```

### Opdracht 2: Deployment + Service aanmaken

```bash
# Voeg kubernetes_deployment en kubernetes_service resources toe aan main.tf

# Bekijk wat er gaat gebeuren
terraform plan

# Voer door
terraform apply
# Typ "yes" om te bevestigen

# Check resultaat
kubectl get pods -n dotnovi
kubectl get svc -n dotnovi
```

### Opdracht 3: Wijzigen en opruimen

```bash
# Wijzig replicas van 2 naar 4 in main.tf

# Bekijk het verschil
terraform plan
# Output: ~ kubernetes_deployment.dotnovi will be updated in-place

# Voer door
terraform apply

# Check: 4 pods draaien nu
kubectl get pods -n dotnovi

# Opruimen
terraform destroy
```

## Best Practices

```
1. State file NOOIT in Git → .gitignore
2. terraform.lock.hcl WEL in Git → provider versie-locking
3. Altijd terraform plan VOOR apply → review het verschil
4. Secrets NIET in .tf bestanden → environment variables of Vault
5. Modulair opbouwen → herbruikbare blokken
```

## .gitignore voor Terraform

```
# Terraform
.terraform/
*.tfstate
*.tfstate.backup
*.tfvars
!terraform.lock.hcl
```

## Bestandsstructuur

```
les-07-iac-terraform/
├── README.md
└── terraform/
    └── main.tf          # Volledige Terraform configuratie (voorbeeld)
```

## Resources

- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
- [Kubernetes Provider](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs)
- [Learn Terraform](https://developer.hashicorp.com/terraform/tutorials)
