<script lang=ts>
    import { goto } from "$app/navigation";
    async function move() {
        try {
            await goto('/search');
        } catch (error) {
            console.error("Failed to navigate:", error);
        }
    }
    move()
</script>