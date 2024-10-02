import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { Marketplace } from '../page-objects';
import { expect, test } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('Private apps upload', () => {
	let poMarketplace: Marketplace;

	test.beforeEach(async ({ page }) => {
		poMarketplace = new Marketplace(page);

		await page.goto('/marketplace/private');
	});

	test.describe('Premium', () => {
		test.skip(!IS_EE, 'Premium Only');

		test('expect to allow admin to upload a private app in EE, which should be enabled by default', async ({ page }) => {
			const fileChooserPromise = page.waitForEvent('filechooser');

			await poMarketplace.btnUploadPrivateApp.click();
			await expect(poMarketplace.btnInstallPrivateApp).toBeDisabled();

			await poMarketplace.btnUploadPrivateAppFile.click();
			const fileChooser = await fileChooserPromise;
			await fileChooser.setFiles('./tests/e2e/fixtures/files/test-app_0.0.1.zip');

			await expect(poMarketplace.btnInstallPrivateApp).toBeEnabled();
			await poMarketplace.btnInstallPrivateApp.click();
			await page.getByRole('button', { name: 'Agree' }).click();
			await expect(poMarketplace.appStatusTag).toHaveText('Enabled');
		});
	});

	test.describe('Community Edition', () => {
		test.skip(IS_EE, 'CE Only');

		test('expect to allow admin to upload a private app in CE, but it should be disabled by default', async ({ page }) => {
			const fileChooserPromise = page.waitForEvent('filechooser');

			await poMarketplace.btnUploadPrivateApp.click();
			await expect(poMarketplace.btnConfirmAppUploadModal).toBeEnabled();
			await poMarketplace.btnConfirmAppUploadModal.click();

			await expect(poMarketplace.btnInstallPrivateApp).toBeDisabled();
			await poMarketplace.btnUploadPrivateAppFile.click();
			const fileChooser = await fileChooserPromise;
			await fileChooser.setFiles('./tests/e2e/fixtures/files/test-app_0.0.1.zip');

			await expect(poMarketplace.btnInstallPrivateApp).toBeEnabled();
			await poMarketplace.btnInstallPrivateApp.click();

			await expect(poMarketplace.confirmAppUploadModalTitle).toHaveText('Private apps limit reached');
			await expect(poMarketplace.btnConfirmAppUploadModal).toBeEnabled();
			await poMarketplace.btnConfirmAppUploadModal.click();

			await page.getByRole('button', { name: 'Agree' }).click();
			await expect(poMarketplace.appStatusTag).toHaveText('Disabled');
		});

		test('expect not to allow enabling a recently installed private app in CE', async () => {
			await poMarketplace.lastAppRow.click();
			await expect(poMarketplace.appStatusTag).toHaveText('Disabled');
			await poMarketplace.appMenu.click();
			await expect(poMarketplace.btnEnableApp).toBeDisabled();
		});
	});
});