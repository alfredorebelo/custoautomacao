import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Calculator } from "@/components/Calculator";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SponsorBar } from "@/components/SponsorBar";
import { recommend } from "@/lib/recommend";
import { SAMPLE_SCENARIO } from "@/lib/parse-scenario";

describe("interação", () => {
  it("mostra erros junto dos campos e empilha o formulário no móvel", () => {
    render(
      <Calculator
        example={false}
        result={null}
        values={{ workflows: "-1", runsPerWorkflow: "1", actionsPerItem: "1", itemsPerRun: "1", branchActionsPerRun: "0", aiStepsPerRun: "0", commitment: "annual" }}
        errors={[{ field: "workflows", message: "o número de fluxos tem de ser um número inteiro igual ou superior a zero." }]}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("inteiro");
    expect(screen.getByRole("textbox", { name: /Fluxos/ })).toHaveAttribute("aria-invalid", "true");
    expect(document.querySelector('[class*="sm:grid-cols-2"]')).toHaveClass("grid");
  });

  it("fecha a barra que não afirma haver patrocinador", async () => {
    window.sessionStorage.clear();
    const user = userEvent.setup();
    render(<SponsorBar />);
    const close = await screen.findByRole("button", { name: "Fechar" });
    expect(screen.getByRole("complementary")).toHaveTextContent("ainda sem patrocinador");
    expect(screen.getByRole("complementary")).toHaveTextContent("PVP com IVA incluído");
    await user.click(close);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("deixa a newsletter desligada sem prometer envio", () => {
    render(<NewsletterForm enabled={false} />);
    expect(screen.getByRole("status")).toHaveTextContent("Não guardámos nenhum endereço");
    expect(screen.getByRole("button", { name: "Pedir confirmação" })).toBeDisabled();
  });

  it("mantém o resultado de exemplo legível", () => {
    const result = recommend(SAMPLE_SCENARIO);
    render(<Calculator example values={{ workflows: "2", runsPerWorkflow: "30", actionsPerItem: "3", itemsPerRun: "1", branchActionsPerRun: "0", aiStepsPerRun: "0", commitment: "annual" }} errors={[]} result={result} />);
    expect(screen.getByText(/moedas diferentes/i)).toBeInTheDocument();
  });
});
